import { Test, TestingModule } from '@nestjs/testing';

import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { AIAdminAction } from './dto/generate-ai-admin.dto';

describe('AIController', () => {
  let controller: AIController;
  const aiService = { generateAdminContent: jest.fn() };

  beforeEach(async () => {
    aiService.generateAdminContent.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIController],
      providers: [{ provide: AIService, useValue: aiService }],
    }).compile();

    controller = module.get<AIController>(AIController);
  });

  it('preserves the Angular response contract', async () => {
    aiService.generateAdminContent.mockResolvedValue({ result: 'Fresh Bananas, 1 kg' });

    await expect(
      controller.generate({ action: AIAdminAction.REPHRASE_TITLE, title: 'bananas' }),
    ).resolves.toEqual({
      message: 'AI content generated successfully',
      result: 'Fresh Bananas, 1 kg',
    });
  });
});
