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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

// import { fileTypeFromBuffer } from 'file-type';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { USER_ROLES } from '../common/constants/enums';

import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GetAdminCategoriesDto } from './dto/get-admin-categories.dto';

const MAX_CATEGORY_IMAGE_SIZE = 5 * 1024 * 1024;

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  async createCategory(
    @Body() data: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is missing');
    }

    // Check file size
    if (file.size > MAX_CATEGORY_IMAGE_SIZE) {
      throw new BadRequestException('Image size must not exceed 5MB');
    }

    // Dynamically import file-type to check the actual file type
    const { fileTypeFromBuffer } = await import('file-type');
    const detectedType = await fileTypeFromBuffer(file.buffer);

    // Validate the actual file type
    if (
      !detectedType ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(detectedType.mime)
    ) {
      throw new BadRequestException(
        'Only JPEG, PNG, JPG, and WebP images are allowed',
      );
    }

    const category = await this.categoryService.createCategory(data, file);

    return {
      message: 'Category created successfully',
      category,
    };
  }

  // Update a category
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  async updateCategory(
    @Param('id') id: string,
    @Body() data: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const category = await this.categoryService.updateCategory(id, data, file);

    return {
      message: 'Category updated successfully',
      category,
    };
  }

  // Deactivate a category
  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  async deactivateCategory(@Param('id') id: string) {
    const category = await this.categoryService.deactivateCategory(id);

    return {
      message: 'Category deactivated successfully',
      category,
    };
  }

  // Activate a category
  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  async activateCategory(@Param('id') id: string) {
    const category = await this.categoryService.activateCategory(id);

    return {
      message: 'Category activated successfully',
      category,
    };
  }

  // Permanently delete a category
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  async deleteCategory(@Param('id') id: string) {
    const category = await this.categoryService.deleteCategory(id);

    return {
      message: 'Category permanently deleted successfully',
      category,
    };
  }

  // Get categories for admin with pagination and search
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ADMIN)
  async getAdminCategories(@Query() query: GetAdminCategoriesDto) {
    const result = await this.categoryService.getAdminCategories(query);

    return {
      message: 'Admin categories retrieved successfully',
      ...result,
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
