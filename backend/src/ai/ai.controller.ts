import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { AIService } from './ai.service';
import { GenerateAIAdminDto } from './dto/generate-ai-admin.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { USER_ROLES } from '../common/constants/enums';

@Controller('admin/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('generate')
  @Roles(USER_ROLES.ADMIN)
  async generate(@Body() body: GenerateAIAdminDto) {
    const result = await this.aiService.generateAdminContent(body);

    return {
      message: 'AI content generated successfully',
      ...result,
    };
  }
}
