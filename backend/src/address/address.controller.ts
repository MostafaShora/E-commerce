import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('address')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  async getUserAddresses(@Req() req: Request) {
    const userId = req.user!._id.toString();

    const result = await this.addressService.getUserAddresses(userId);

    return {
      message: 'Addresses retrieved successfully',
      ...result,
    };
  }

  @Post()
  async createAddress(@Req() req: Request, @Body() data: CreateAddressDto) {
    const userId = req.user!._id.toString();

    const address = await this.addressService.createAddress(userId, data);

    return {
      message: 'Address created successfully',
      address,
    };
  }

  @Patch(':id')
  async updateAddress(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() data: UpdateAddressDto,
  ) {
    const userId = req.user!._id.toString();

    const address = await this.addressService.updateAddress(userId, id, data);

    return {
      message: 'Address updated successfully',
      address,
    };
  }

  @Delete(':id')
  async deleteAddress(@Req() req: Request, @Param('id') id: string) {
    const userId = req.user!._id.toString();

    const address = await this.addressService.deleteAddress(userId, id);

    return {
      message: 'Address deleted successfully',
      address,
    };
  }
}
