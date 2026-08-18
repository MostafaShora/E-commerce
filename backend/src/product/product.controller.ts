import { Controller, Get, Query, Param } from '@nestjs/common';

import { ProductService } from './product.service';
import { GetProductsDto } from './dto/get-products.dto';
import { GetProductBySlugDto } from './dto/get-product-by-slug.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

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
