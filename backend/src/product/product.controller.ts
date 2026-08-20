import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { ProductService } from './product.service';
import { GetProductsDto } from './dto/get-products.dto';
import { GetProductBySlugDto } from './dto/get-product-by-slug.dto';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createProduct(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateProductDto & { userId: string },
  ) {
    const { userId, ...productData } = body;

    const product = await this.productService.createProduct(
      userId,
      productData,
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

  @Get(':slug')
  async getProductBySlug(@Param() params: GetProductBySlugDto) {
    const result = await this.productService.getProductBySlug(params.slug);

    return {
      message: 'Product retrieved successfully',
      ...result,
    };
  }
}
