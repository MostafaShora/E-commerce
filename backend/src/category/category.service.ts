import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async getCategories() {
    const categories = await this.categoryModel
      .find({
        isActive: true,
      })
      .sort({
        _id: 1,
      })
      .lean();

    return {
      categories,
    };
  }

  async createCategory(data: CreateCategoryDto) {
    const category = await this.categoryModel.create(data);

    return category;
  }
}
