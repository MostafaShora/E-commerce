import {
  BadRequestException,
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
    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    // Discount filter
    if (hasDiscount !== undefined) {
      filter.discountPercent = hasDiscount ? { $gt: 0 } : 0;
    }

    // Stock filter
    if (inStock !== undefined) {
      filter.stockCount = { $gt: 0 };
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
    if (keyword) {
      filter.$or = [
        {
          name: {
            $regex: keyword,
            $options: 'i',
          },
        },
        {
          description: {
            $regex: keyword,
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
      products,

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
      products,
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
      product,
      relatedProducts,
    };
  }

  async createProduct(
    userId: string,
    data: CreateProductDto,
    file?: Express.Multer.File,
  ) {
    if (!Types.ObjectId.isValid(data.categoryId)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryModel.findById(data.categoryId).lean();

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    const product = await this.productModel.create({
      ...data,
      userId: new Types.ObjectId(userId),
      categoryId: new Types.ObjectId(data.categoryId),

      images: file ? [`/uploads/${file.filename}`] : [],
    });

    return product;
  }
}
