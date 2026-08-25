import { Body, Controller, Post } from '@nestjs/common';

import { AIService } from './ai.service';
import { GenerateAIAdminDto } from './dto/generate-ai-admin.dto';

@Controller('admin/ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('generate')
  async generate(@Body() body: GenerateAIAdminDto) {
    const result = await this.aiService.generateAdminContent(body);

    return {
      message: 'AI content generated successfully',
      ...result,
    };
  }
}
