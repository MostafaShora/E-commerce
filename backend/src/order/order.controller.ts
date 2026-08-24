import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

import type { Request } from 'express';

import { OrderService } from './order.service';

import { CreateOrderDto } from './dto/create-order.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { Roles } from '../auth/decorators/roles.decorator';

import { RolesGuard } from '../auth/guards/roles.guard';

import { USER_ROLES } from '../common/constants/enums';

import { GetAdminOrdersDto } from './dto/get-admin-orders.dto';

@Controller('order')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@Req() req: Request, @Body() data: CreateOrderDto) {
    const userId = req.user!._id.toString();

    const result = await this.orderService.createOrder(userId, data);

    return {
      message: 'Order created successfully',
      ...result,
    };
  }

  @Get()
  async getUserOrders(@Req() req: Request) {
    const userId = req.user!._id.toString();

    const result = await this.orderService.getUserOrders(userId);

    return {
      message: 'Orders retrieved successfully',
      ...result,
    };
  }

  @Get('admin/all')
  @Roles(USER_ROLES.ADMIN)
  @UseGuards(RolesGuard)
  async getAllOrdersForAdmin(@Query() query: GetAdminOrdersDto) {
    const result = await this.orderService.getAllOrdersForAdmin(
      query.status,
      query.page,
      query.limit,
    );

    return {
      message: 'All orders retrieved successfully',
      ...result,
    };
  }

  @Get('admin/:id')
  @Roles(USER_ROLES.ADMIN)
  @UseGuards(RolesGuard)
  async getAdminOrderById(@Param('id') id: string) {
    const result = await this.orderService.getAdminOrderById(id);

    return {
      message: 'Admin order retrieved successfully',
      ...result,
    };
  }

  @Patch('admin/:id/status')
  @Roles(USER_ROLES.ADMIN)
  @UseGuards(RolesGuard)
  async updateAdminOrderStatus(
    @Param('id') id: string,
    @Body() data: UpdateOrderStatusDto,
  ) {
    const result = await this.orderService.updateAdminOrderStatus(
      id,
      data.status,
      data.note,
    );

    return {
      message: 'Order status updated successfully',
      ...result,
    };
  }

  @Get(':id')
  async getUserOrderById(@Req() req: Request, @Param('id') id: string) {
    const userId = req.user!._id.toString();

    const result = await this.orderService.getUserOrderById(userId, id);

    return {
      message: 'Order retrieved successfully',
      ...result,
    };
  }

  // @Patch(':id/status')
  // @Roles(USER_ROLES.ADMIN)
  // @UseGuards(RolesGuard)
  // async updateOrderStatus(
  //   @Req() req: Request,
  //   @Param('id') id: string,
  //   @Body() data: UpdateOrderStatusDto,
  // ) {
  //   const userId = req.user!._id.toString();

  //   const result = await this.orderService.updateOrderStatus(
  //     userId,
  //     id,
  //     data.status,
  //   );

  //   return {
  //     message: 'Order status updated successfully',
  //     ...result,
  //   };
  // }
}
