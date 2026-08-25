import { Injectable } from '@nestjs/common';

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
    const { generateText } = await this.getAiSdk();

    if (data.action === AIAdminAction.REPHRASE_TITLE) {
      const { text } = await generateText({
        model: 'google/gemini-2.5-flash-lite',
        system: REPHRASE_TITLE_SYSTEM_PROMPT,
        prompt: `Title: ${data.title ?? ''}\nUnit: ${data.unit ?? ''}`,
      });

      return { result: text.trim() };
    }

    if (data.action === AIAdminAction.GENERATE_DESC) {
      const { text } = await generateText({
        model: 'google/gemini-2.5-flash-lite',
        system: GENERATE_DESCRIPTION_SYSTEM_PROMPT,
        prompt:
          `Title: ${data.title ?? ''}\n` +
          `Unit: ${data.unit ?? ''}\n` +
          `Existing description: ${data.description ?? ''}`,
      });

      return { result: text.trim() };
    }

    throw new Error('Unsupported AI admin action');
  }
}
