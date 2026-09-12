import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AIAdminAction, GenerateAIAdminDto } from './dto/generate-ai-admin.dto';

import {
  GENERATE_DESCRIPTION_SYSTEM_PROMPT,
  REPHRASE_TITLE_SYSTEM_PROMPT,
} from './prompts/ai.prompts';

const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateAdminContent(
    data: GenerateAIAdminDto,
  ): Promise<{ result: string }> {
    const request = this.createRequest(data);
    const apiKey = this.configService.get<string>('GEMINI_API_KEY')?.trim();

    if (!apiKey) {
      throw new ServiceUnavailableException('AI service is not configured');
    }

    const modelId =
      this.configService.get<string>('GEMINI_MODEL')?.trim() ||
      DEFAULT_GEMINI_MODEL;

    try {
      const { createGoogleGenerativeAI, generateText } = await this.loadAiSdk();
      const google = createGoogleGenerativeAI({ apiKey });
      const { text } = await generateText({
        model: google(modelId),
        ...request,
      });
      const result = text.trim();

      if (!result) {
        this.logger.warn(
          'Gemini returned an empty response for admin content generation',
        );
        throw new BadGatewayException(
          'AI service returned an invalid response',
        );
      }

      return { result };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.throwProviderError(error, modelId);
    }
  }

  private async loadAiSdk() {
    // Both packages are ESM-only. Dynamic imports retain Nest's CommonJS
    // compatibility while still calling Gemini directly through AI SDK.
    const [googleSdk, aiSdk] = await Promise.all([
      import('@ai-sdk/google'),
      import('ai'),
    ]);

    return {
      createGoogleGenerativeAI: googleSdk.createGoogleGenerativeAI,
      generateText: aiSdk.generateText,
    };
  }

  private createRequest(data: GenerateAIAdminDto): {
    system: string;
    prompt: string;
  } {
    if (!data.title?.trim()) {
      throw new BadRequestException(
        data.action === AIAdminAction.REPHRASE_TITLE
          ? 'Title is required for rephrase-title action'
          : 'Title is required for generate-desc action',
      );
    }

    if (data.action === AIAdminAction.REPHRASE_TITLE) {
      return {
        system: REPHRASE_TITLE_SYSTEM_PROMPT,
        prompt: `Title: ${data.title.trim()}\nUnit: ${data.unit?.trim() ?? ''}`,
      };
    }

    if (data.action === AIAdminAction.GENERATE_DESC) {
      return {
        system: GENERATE_DESCRIPTION_SYSTEM_PROMPT,
        prompt:
          `Title: ${data.title.trim()}\n` +
          `Unit: ${data.unit?.trim() ?? ''}\n` +
          `Existing description: ${data.description?.trim() ?? ''}`,
      };
    }

    throw new BadRequestException('Unsupported AI admin action');
  }

  private throwProviderError(error: unknown, modelId: string): never {
    const providerError = this.findProviderError(error);
    const statusCode = providerError?.statusCode;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    const diagnostics = this.getProviderDiagnostics(providerError);

    // Only log selected, scrubbed provider metadata. Requests, headers and keys
    // are never included in diagnostics or returned to the client.
    this.logger.error('Gemini generation failed', {
      modelId,
      providerStatus: statusCode ?? 'unknown',
      errorName,
      ...diagnostics,
    });

    if (statusCode === 429) {
      throw new HttpException(
        'AI service is busy. Please try again shortly.',
        429,
      );
    }

    if (statusCode === 404) {
      throw new ServiceUnavailableException(
        'The configured AI model is unavailable. Please contact an administrator.',
      );
    }

    if (statusCode === 400) {
      throw new BadGatewayException('AI service returned an invalid response');
    }

    // 401/403 are Gemini credentials or permission failures, never app auth errors.
    throw new ServiceUnavailableException(
      'AI service is temporarily unavailable',
    );
  }

  private findProviderError(
    error: unknown,
  ): { statusCode?: number; responseBody?: unknown } | undefined {
    let current: unknown = error;

    // AI SDK can wrap an APICallError in a retry error. Inspect only status-code
    // metadata from the bounded cause chain, never provider messages or bodies.
    for (let index = 0; index < 5; index += 1) {
      if (typeof current !== 'object' || current === null) return undefined;

      const providerError = current as {
        statusCode?: unknown;
        lastError?: unknown;
        cause?: unknown;
      };
      if (typeof providerError.statusCode === 'number') {
        return {
          statusCode: providerError.statusCode,
          responseBody:
            'responseBody' in providerError
              ? providerError.responseBody
              : undefined,
        };
      }

      current = providerError.lastError ?? providerError.cause;
    }

    return undefined;
  }

  private getProviderDiagnostics(
    providerError: { responseBody?: unknown } | undefined,
  ) {
    if (typeof providerError?.responseBody !== 'string') return {};

    try {
      const parsed = JSON.parse(providerError.responseBody) as {
        error?: { code?: unknown; status?: unknown; message?: unknown };
      };
      const message = parsed.error?.message;
      return {
        providerCode:
          typeof parsed.error?.code === 'number'
            ? parsed.error.code
            : undefined,
        providerErrorStatus:
          typeof parsed.error?.status === 'string'
            ? parsed.error.status
            : undefined,
        providerMessage:
          typeof message === 'string'
            ? this.redactProviderMessage(message)
            : undefined,
      };
    } catch {
      return { providerErrorBody: 'unparseable' };
    }
  }

  private redactProviderMessage(message: string): string {
    return message
      .replace(/AIza[\w-]+/g, '[REDACTED]')
      .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
      .slice(0, 500);
  }
}
