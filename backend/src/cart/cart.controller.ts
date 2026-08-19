import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import type { Request } from 'express';

import { CartService } from './cart.service';
import { UpsertCartDto } from './dto/upsert-cart.dto';

import { OptionalCartAuthGuard } from './guards/optional-cart-auth.guard';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @UseGuards(OptionalCartAuthGuard)
  async upsertCart(@Req() req: Request, @Body() data: UpsertCartDto) {
    const userId = req.user ? req.user._id.toString() : null;

    const guestCartId = req.guestCartId ?? null;

    const result = await this.cartService.upsertCart(userId, guestCartId, data);

    return {
      message: 'Cart updated successfully',
      ...result,
    };
  }

  @Get()
  @UseGuards(OptionalCartAuthGuard)
  async getCart(@Req() req: Request) {
    const userId = req.user ? req.user._id.toString() : null;

    const guestCartId = req.guestCartId ?? null;

    const result = await this.cartService.getCart(userId, guestCartId);

    return {
      message: 'Cart retrieved successfully',
      ...result,
    };
  }
}
