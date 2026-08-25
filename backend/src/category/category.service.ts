import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Model, Types } from 'mongoose';

import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

import { Product, ProductDocument } from '../product/schemas/product.schema';

import slugify from 'slugify';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from '../common/utils/cloudinary.util';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
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

  async createCategory(data: CreateCategoryDto, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const slug = slugify(data.name, {
      lower: true,
      strict: true,
    });

    const existingCategory = await this.categoryModel.findOne({
      slug,
    });

    if (existingCategory) {
      throw new ConflictException('Category already exists');
    }

    const uploadedImage = await uploadImageToCloudinary(
      file,
      'ecommerce/categories',
    );

    try {
      const category = await this.categoryModel.create({
        ...data,
        slug,
        image: {
          url: uploadedImage.url,
          publicId: uploadedImage.publicId,
        },
      });

      return category;
    } catch (error) {
      // Rollback Cloudinary upload if MongoDB creation fails
      await deleteImageFromCloudinary(uploadedImage.publicId);

      throw error;
    }
  }

  async updateCategory(
    categoryId: string,
    data: UpdateCategoryDto,
    file?: Express.Multer.File,
  ) {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    let newImage:
      | {
          url: string;
          publicId: string;
        }
      | undefined;

    // Update name / slug

    if (data.name !== undefined) {
      const newSlug = slugify(data.name, {
        lower: true,
        strict: true,
      });

      const existingCategory = await this.categoryModel.findOne({
        slug: newSlug,
        _id: { $ne: category._id },
      });

      if (existingCategory) {
        throw new ConflictException('Category already exists');
      }

      category.name = data.name;
      category.slug = newSlug;
    }

    // Update description

    if (data.description !== undefined) {
      category.description = data.description;
    }

    // Update active status

    if (data.isActive !== undefined) {
      category.isActive = data.isActive;
    }

    // Upload new image

    if (file) {
      const uploadedImage = await uploadImageToCloudinary(
        file,
        'ecommerce/categories',
      );

      newImage = {
        url: uploadedImage.url,
        publicId: uploadedImage.publicId,
      };
    }

    const oldImagePublicId = category.image?.publicId;

    // Save MongoDB

    if (newImage) {
      category.image = newImage;
    }

    try {
      await category.save();
    } catch (error) {
      // If MongoDB update fails, remove newly uploaded image
      if (newImage) {
        await deleteImageFromCloudinary(newImage.publicId);
      }

      throw error;
    }

    // Delete old Cloudinary image

    if (
      newImage &&
      oldImagePublicId &&
      oldImagePublicId !== newImage.publicId
    ) {
      await deleteImageFromCloudinary(oldImagePublicId);
    }

    return category;
  }

  // Deactivate a category
  async deactivateCategory(categoryId: string) {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.isActive) {
      throw new BadRequestException('Category is already deactivated');
    }

    category.isActive = false;

    await category.save();

    return category;
  }

  // Activate a category
  async activateCategory(categoryId: string) {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.isActive) {
      throw new BadRequestException('Category is already active');
    }

    category.isActive = true;

    await category.save();

    return category;
  }

  // Delete a category
  async deleteCategory(categoryId: string) {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const productsCount = await this.productModel.countDocuments({
      categoryId: category._id,
    });

    if (productsCount > 0) {
      throw new ConflictException(
        'Cannot permanently delete category because it has products',
      );
    }

    const imagePublicId = category.image?.publicId;

    if (imagePublicId) {
      await deleteImageFromCloudinary(imagePublicId);
    }

    await this.categoryModel.deleteOne({
      _id: category._id,
    });

    return category;
  }
}
