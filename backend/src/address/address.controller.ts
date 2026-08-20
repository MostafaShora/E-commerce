import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import type { Request } from 'express';

import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('address')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  async createAddress(@Req() req: Request, @Body() data: CreateAddressDto) {
    const userId = req.user!._id.toString();

    const address = await this.addressService.createAddress(userId, data);

    return {
      message: 'Address created successfully',
      address,
    };
  }

  @Get()
  async getUserAddresses(@Req() req: Request) {
    const userId = req.user!._id.toString();

    const result = await this.addressService.getUserAddresses(userId);

    return {
      message: 'Addresses retrieved successfully',
      ...result,
    };
  }
}
