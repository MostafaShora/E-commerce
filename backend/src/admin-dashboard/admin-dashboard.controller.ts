import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { USER_ROLES } from '../common/constants/enums';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('analytics')
  @Roles(USER_ROLES.ADMIN)
  async getAnalytics() {
    return {
      message: 'Analytics retrieved successfully',
      ...(await this.adminDashboardService.getAnalytics()),
    };
  }
}
