import { Body, Controller, Get, Post } from '@nestjs/common';

import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async createCategory(@Body() data: CreateCategoryDto) {
    const category = await this.categoryService.createCategory(data);

    return {
      message: 'Category created successfully',
      category,
    };
  }

  @Get()
  async getCategories() {
    const result = await this.categoryService.getCategories();

    return {
      message: 'Categories retrieved successfully',
      ...result,
    };
  }
}
