import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { OrderService } from './order.service';

import { CreateOrderDto } from './dto/create-order.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

  @Get(':id')
  async getUserOrderById(@Req() req: Request, @Param('id') id: string) {
    const userId = req.user!._id.toString();

    const result = await this.orderService.getUserOrderById(userId, id);

    return {
      message: 'Order retrieved successfully',
      ...result,
    };
  }
}
