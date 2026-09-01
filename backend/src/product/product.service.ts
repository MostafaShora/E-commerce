import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Product, ProductDocument } from './schemas/product.schema';

import { GetProductsDto, ProductSort } from './dto/get-products.dto';

import { CreateProductDto } from './dto/create-product.dto';

import {
  Category,
  CategoryDocument,
} from '../category/schemas/category.schema';

import { uploadImageToCloudinary } from '../common/utils/cloudinary.util';

import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsAdminDto } from './dto/get-products-admin.dto';
import { deleteImageFromCloudinary } from '../common/utils/cloudinary.util';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Transform product document to API response format
 * Converts ProductImage[] to string[] (image URLs only)
 */
function transformProductForResponse(product: any): any {
  if (!product) return product;

  const transformed = { ...product };

  // Convert images from ProductImage[] to string[]
  if (transformed.images && Array.isArray(transformed.images)) {
    transformed.images = transformed.images.map((img: any) => {
      // If it's already a string (shouldn't happen), keep it
      if (typeof img === 'string') return img;
      // If it's an object with url property, extract the URL
      return img?.url || '';
    });
  }

  return transformed;
}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async getProducts(query: GetProductsDto) {
    const {
      categoryId,
      page,
      limit,
      hasDiscount,
      inStock,
      minPrice,
      maxPrice,
      sort,
      keyword,
      skip,
    } = query;

    const filter: Record<string, unknown> = {
      isActive: true,
    };

    // Category filter
    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId)) {
        throw new BadRequestException('Invalid category ID');
      }

      filter.categoryId = new Types.ObjectId(categoryId);
    }

    // Discount filter
    if (hasDiscount !== undefined) {
      filter.discountPercent = hasDiscount ? { $gt: 0 } : 0;
    }

    // Stock filter
    if (inStock !== undefined) {
      filter.stockCount = inStock ? { $gt: 0 } : { $eq: 0 };
    }

    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      const salePrice: Record<string, number> = {};

      if (minPrice !== undefined) {
        salePrice.$gte = minPrice;
      }

      if (maxPrice !== undefined) {
        salePrice.$lte = maxPrice;
      }

      filter.salePrice = salePrice;
    }

    // Keyword search
    if (keyword?.trim()) {
      const escapedKeyword = escapeRegex(keyword.trim());

      filter.$or = [
        {
          name: {
            $regex: escapedKeyword,
            $options: 'i',
          },
        },
        {
          description: {
            $regex: escapedKeyword,
            $options: 'i',
          },
        },
      ];
    }

    const sortMap: Record<ProductSort, Record<string, 1 | -1>> = {
      [ProductSort.BEST_MATCH]: {
        createdAt: -1,
      },

      [ProductSort.PRICE_LOW]: {
        salePrice: 1,
      },

      [ProductSort.PRICE_HIGH]: {
        salePrice: -1,
      },

      [ProductSort.HIGHEST_RATING]: {
        ratingAverage: -1,
      },
    };

    const effectiveSkip = skip ?? (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sortMap[sort])
        .skip(effectiveSkip)
        .limit(limit)
        .populate('categoryId', 'name slug')
        .select(
          'name slug images unit originalPrice salePrice discountPercent discountLabel stockCount ratingAverage reviewCount categoryId',
        )
        .lean(),

      this.productModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      products: products.map(transformProductForResponse),

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasNextPage: effectiveSkip + limit < total,

        hasPrevPage: page > 1,
      },
    };
  }

  async getDeals(limit: number) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'Limit must be an integer between 1 and 100',
      );
    }

    const products = await this.productModel
      .find({
        isActive: true,
        discountPercent: { $gt: 0 },
        stockCount: { $gt: 0 },
      })
      .sort({ discountPercent: -1 })
      .limit(limit)
      .select(
        'name slug images originalPrice salePrice discountPercent discountLabel unit ratingAverage reviewCount',
      )
      .lean();

    return {
      products: products.map(transformProductForResponse),
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.productModel
      .findOne({
        slug,
        isActive: true,
      })
      .populate('categoryId', 'name slug')
      .select(
        'name slug images description originalPrice salePrice unit discountPercent discountLabel stockCount ratingAverage reviewCount categoryId createdAt',
      )
      .lean();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const relatedProducts = await this.productModel
      .find({
        categoryId: product.categoryId,
        isActive: true,
        slug: { $ne: slug },
      })
      .sort({ createdAt: -1 })
      .limit(6)
      .select(
        'name slug images originalPrice salePrice discountPercent discountLabel ratingAverage reviewCount',
      )
      .lean();

    return {
      product: transformProductForResponse(product),
      relatedProducts: relatedProducts.map(transformProductForResponse),
    };
  }

  // Create product
  // Create product
  async createProduct(
    userId: string,
    data: CreateProductDto,
    file?: Express.Multer.File,
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    if (!Types.ObjectId.isValid(data.categoryId)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findById(data.categoryId).lean();

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    let uploadedImage: {
      url: string;
      publicId: string;
    } | null = null;

    try {
      // Upload image to Cloudinary
      if (file) {
        uploadedImage = await uploadImageToCloudinary(
          file,
          'ecommerce/products',
        );
      }

      // Create product
      const product = await this.productModel.create({
        ...data,
        userId: new Types.ObjectId(userId),
        categoryId: new Types.ObjectId(data.categoryId),
        images: uploadedImage
          ? [
              {
                url: uploadedImage.url,
                publicId: uploadedImage.publicId,
              },
            ]
          : [],
      });

      return transformProductForResponse(product.toObject ? product.toObject() : product);
    } catch (error) {
      // Cleanup Cloudinary image if MongoDB creation failed
      if (uploadedImage?.publicId) {
        try {
          await deleteImageFromCloudinary(uploadedImage.publicId);
        } catch (cleanupError) {
          console.error(
            'Failed to cleanup Cloudinary image after product creation failed:',
            cleanupError,
          );
        }
      }

      // Duplicate slug
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new ConflictException('A product with this name already exists');
      }

      throw error;
    }
  }

  async updateProduct(productId: string, data: UpdateProductDto) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (data.categoryId) {
      if (!Types.ObjectId.isValid(data.categoryId)) {
        throw new BadRequestException('Invalid category ID');
      }

      const category = await this.categoryModel
        .findById(data.categoryId)
        .lean();

      if (!category) {
        throw new BadRequestException('Category not found');
      }

      product.categoryId = new Types.ObjectId(data.categoryId);
    }

    if (data.name !== undefined) {
      product.name = data.name;
    }

    if (data.description !== undefined) {
      product.description = data.description;
    }

    if (data.originalPrice !== undefined) {
      product.originalPrice = data.originalPrice;
    }

    if (data.discountPercent !== undefined) {
      product.discountPercent = data.discountPercent;
    }

    if (data.discountLabel !== undefined) {
      product.discountLabel = data.discountLabel;
    }

    if (data.unit !== undefined) {
      product.unit = data.unit;
    }

    if (data.stockCount !== undefined) {
      product.stockCount = data.stockCount;
    }

    if (data.isActive !== undefined) {
      product.isActive = data.isActive;
    }

    await product.save();

    return transformProductForResponse(product.toObject ? product.toObject() : product);
  }

  // Deactivate product
  async deactivateProduct(productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is already deactivated');
    }

    product.isActive = false;

    await product.save();

    return transformProductForResponse(product.toObject ? product.toObject() : product);
  }

  // Activate product
  async activateProduct(productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.isActive) {
      throw new BadRequestException('Product is already active');
    }

    product.isActive = true;

    await product.save();

    return transformProductForResponse(product.toObject ? product.toObject() : product);
  }

  // Get products for admin with pagination
  async getProductsAdmin(query: GetProductsAdminDto) {
    const { page, limit } = query;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name slug')
        .select(
          'name slug images description originalPrice salePrice discountPercent discountLabel unit stockCount ratingAverage reviewCount categoryId isActive createdAt updatedAt',
        )
        .lean(),

      this.productModel.countDocuments({}),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      products: products.map(transformProductForResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // Permanent delete product
  async deleteProduct(productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Delete product images from Cloudinary
    if (product.images?.length) {
      for (const image of product.images) {
        if (image.publicId) {
          await deleteImageFromCloudinary(image.publicId);
        }
      }
    }

    // Delete product from MongoDB
    await this.productModel.findByIdAndDelete(productId);

    return product;
  }
}
