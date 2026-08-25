import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { AIAdminAction, GenerateAIAdminDto } from './dto/generate-ai-admin.dto';

import {
  GENERATE_DESCRIPTION_SYSTEM_PROMPT,
  REPHRASE_TITLE_SYSTEM_PROMPT,
} from './prompts/ai.prompts';

@Injectable()
export class AIService {
  private async getAiSdk() {
    return import('ai');
  }

  async generateAdminContent(data: GenerateAIAdminDto) {
    try {
      const { generateText } = await this.getAiSdk();

      if (data.action === AIAdminAction.REPHRASE_TITLE) {
        if (!data.title?.trim()) {
          throw new BadRequestException(
            'Title is required for rephrase-title action',
          );
        }

        const { text } = await generateText({
          model: 'google/gemini-2.5-flash-lite',
          system: REPHRASE_TITLE_SYSTEM_PROMPT,
          prompt:
            `Title: ${data.title.trim()}\n` +
            `Unit: ${data.unit?.trim() ?? ''}`,
        });

        const result = text.trim();

        if (!result) {
          throw new InternalServerErrorException('AI returned an empty result');
        }

        return {
          result,
        };
      }

      if (data.action === AIAdminAction.GENERATE_DESC) {
        if (!data.title?.trim()) {
          throw new BadRequestException(
            'Title is required for generate-desc action',
          );
        }

        const { text } = await generateText({
          model: 'google/gemini-2.5-flash-lite',
          system: GENERATE_DESCRIPTION_SYSTEM_PROMPT,
          prompt:
            `Title: ${data.title.trim()}\n` +
            `Unit: ${data.unit?.trim() ?? ''}\n` +
            `Existing description: ${data.description?.trim() ?? ''}`,
        });

        const result = text.trim();

        if (!result) {
          throw new InternalServerErrorException('AI returned an empty result');
        }

        return {
          result,
        };
      }

      throw new BadRequestException('Unsupported AI admin action');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('AI generation error:', error);

      throw new InternalServerErrorException('Failed to generate AI content');
    }
  }
}
