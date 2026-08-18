import { Controller, Get } from '@nestjs/common';

import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getCategories() {
    const result = await this.categoryService.getCategories();

    return {
      message: 'Categories retrieved successfully',
      ...result,
    };
  }
}
