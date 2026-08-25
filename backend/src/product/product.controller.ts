import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { USER_ROLES } from '../common/constants/enums';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { ProductService } from './product.service';
import { GetProductsDto } from './dto/get-products.dto';
import { GetProductBySlugDto } from './dto/get-product-by-slug.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsAdminDto } from './dto/get-products-admin.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  async createProduct(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateProductDto,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is missing');
    }

    const user = req.user as { _id: string };

    if (!user?._id) {
      throw new BadRequestException('Authenticated user not found');
    }

    const product = await this.productService.createProduct(
      user._id.toString(),
      body,
      file,
    );

    return {
      message: 'Product created successfully',
      product,
    };
  }

  @Get()
  async getProducts(@Query() query: GetProductsDto) {
    const result = await this.productService.getProducts(query);

    return {
      message: 'Products retrieved successfully',
      ...result,
    };
  }

  @Get('deals')
  async getDeals(@Query('limit') limit = '10') {
    const result = await this.productService.getDeals(Number(limit));

    return {
      message: 'Deals retrieved successfully',
      ...result,
    };
  }

  // Get products for admin with pagination
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  async getProductsAdmin(@Query() query: GetProductsAdminDto) {
    const result = await this.productService.getProductsAdmin(query);

    return {
      message: 'Admin products retrieved successfully',
      ...result,
    };
  }

  @Get(':slug')
  async getProductBySlug(@Param() params: GetProductBySlugDto) {
    const result = await this.productService.getProductBySlug(params.slug);

    return {
      message: 'Product retrieved successfully',
      ...result,
    };
  }

  // Update product details
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  async updateProduct(@Param('id') id: string, @Body() body: UpdateProductDto) {
    const product = await this.productService.updateProduct(id, body);

    return {
      message: 'Product updated successfully',
      product,
    };
  }

  // Deactivate product
  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  async deactivateProduct(@Param('id') id: string) {
    const product = await this.productService.deactivateProduct(id);

    return {
      message: 'Product deactivated successfully',
      product,
    };
  }

  // Activate product
  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  async activateProduct(@Param('id') id: string) {
    const product = await this.productService.activateProduct(id);

    return {
      message: 'Product activated successfully',
      product,
    };
  }

  // Permanent delete product
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  async deleteProduct(@Param('id') id: string) {
    const product = await this.productService.deleteProduct(id);

    return {
      message: 'Product permanently deleted successfully',
      product,
    };
  }
}
