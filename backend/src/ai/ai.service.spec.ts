import { BadRequestException, HttpException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AIAdminAction } from './dto/generate-ai-admin.dto';
import { AIService } from './ai.service';

describe('AIService', () => {
  let service: AIService;
  const configService = { get: jest.fn() };

  beforeEach(async () => {
    configService.get.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AIService, { provide: ConfigService, useValue: configService }],
    }).compile();

    service = module.get<AIService>(AIService);
  });

  it('rejects a request without a title before contacting Gemini', async () => {
    await expect(
      service.generateAdminContent({ action: AIAdminAction.REPHRASE_TITLE }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(configService.get).not.toHaveBeenCalled();
  });

  it('fails cleanly when Gemini is not configured', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(
      service.generateAdminContent({
        action: AIAdminAction.GENERATE_DESC,
        title: 'Fresh bananas',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('returns real provider text when Gemini succeeds', async () => {
    configService.get.mockImplementation((key: string) =>
      key === 'GEMINI_API_KEY' ? 'test-key' : 'gemini-3.6-flash',
    );
    const model = jest.fn().mockReturnValue('google-model');
    const generateText = jest.fn().mockResolvedValue({ text: 'Fresh Bananas, 1 kg' });
    jest.spyOn(service as never, 'loadAiSdk' as never).mockResolvedValue({
      createGoogleGenerativeAI: jest.fn().mockReturnValue(model),
      generateText,
    } as never);

    await expect(
      service.generateAdminContent({
        action: AIAdminAction.REPHRASE_TITLE,
        title: 'Fresh bananas',
        unit: '1 kg',
      }),
    ).resolves.toEqual({ result: 'Fresh Bananas, 1 kg' });
    expect(model).toHaveBeenCalledWith('gemini-3.6-flash');
  });

  it('reports a provider 404 as an unavailable configured model', async () => {
    configService.get.mockImplementation((key: string) =>
      key === 'GEMINI_API_KEY' ? 'test-key' : 'missing-model',
    );
    jest.spyOn(service as never, 'loadAiSdk' as never).mockResolvedValue({
      createGoogleGenerativeAI: jest.fn().mockReturnValue(jest.fn()),
      generateText: jest.fn().mockRejectedValue({
        name: 'AI_APICallError',
        statusCode: 404,
        responseBody: JSON.stringify({
          error: { code: 404, status: 'NOT_FOUND', message: 'Unknown model' },
        }),
      }),
    } as never);

    await expect(
      service.generateAdminContent({
        action: AIAdminAction.GENERATE_DESC,
        title: 'Fresh bananas',
      }),
    ).rejects.toMatchObject({
      message: 'The configured AI model is unavailable. Please contact an administrator.',
      status: 503,
    });
  });

  it('maps provider rate limiting to HTTP 429', async () => {
    configService.get.mockImplementation((key: string) =>
      key === 'GEMINI_API_KEY' ? 'test-key' : 'gemini-3.6-flash',
    );
    jest.spyOn(service as never, 'loadAiSdk' as never).mockResolvedValue({
      createGoogleGenerativeAI: jest.fn().mockReturnValue(jest.fn()),
      generateText: jest.fn().mockRejectedValue({ statusCode: 429 }),
    } as never);

    await expect(
      service.generateAdminContent({ action: AIAdminAction.GENERATE_DESC, title: 'Bananas' }),
    ).rejects.toMatchObject({ status: 429 } satisfies Partial<HttpException>);
  });

  it('maps unexpected provider failures to a clean service error', async () => {
    configService.get.mockImplementation((key: string) =>
      key === 'GEMINI_API_KEY' ? 'test-key' : 'gemini-3.6-flash',
    );
    jest.spyOn(service as never, 'loadAiSdk' as never).mockResolvedValue({
      createGoogleGenerativeAI: jest.fn().mockReturnValue(jest.fn()),
      generateText: jest.fn().mockRejectedValue(new Error('provider implementation detail')),
    } as never);

    await expect(
      service.generateAdminContent({ action: AIAdminAction.GENERATE_DESC, title: 'Bananas' }),
    ).rejects.toMatchObject({
      message: 'AI service is temporarily unavailable',
      status: 503,
    });
  });
});
