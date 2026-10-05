import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ProductService } from './product.service';
import { Product } from './schemas/product.schema';
import { Category } from '../category/schemas/category.schema';
import { GetProductsDto } from './dto/get-products.dto';

describe('ProductService', () => {
  let service: ProductService;

  const mockProductModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  };
  const mockCategoryModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    jest.clearAllMocks();
  });

  it('queries related products by the category ObjectId from the populated product', async () => {
    const product = {
      _id: 'product-1',
      slug: 'sample-product',
      name: 'Sample Product',
      images: ['https://example.com/image.jpg'],
      description: 'sample',
      originalPrice: 100,
      salePrice: 80,
      unit: 'pc',
      discountPercent: 20,
      discountLabel: '20% off',
      stockCount: 12,
      ratingAverage: 4.5,
      reviewCount: 10,
      categoryId: {
        _id: 'cat-123',
        name: 'Electronics',
        slug: 'electronics',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    mockProductModel.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(product),
        }),
      }),
    });

    mockProductModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: 'related-1',
                name: 'Related Product',
                slug: 'related-product',
                images: ['https://example.com/related.jpg'],
                originalPrice: 50,
                salePrice: 40,
                discountPercent: 20,
                discountLabel: '20% off',
                ratingAverage: 4.8,
                reviewCount: 8,
              },
            ]),
          }),
        }),
      }),
    });

    const result = await service.getProductBySlug('sample-product');

    expect(mockProductModel.find).toHaveBeenCalledWith({
      categoryId: 'cat-123',
      isActive: true,
      slug: { $ne: 'sample-product' },
    });
    expect(result.relatedProducts).toHaveLength(1);
    expect(result.product.slug).toBe('sample-product');
  });

  it('applies all catalog filters before sorting and pagination and counts the same result set', async () => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ _id: 'product-1', salePrice: 5 }]),
    };
    mockProductModel.find.mockReturnValue(query);
    mockProductModel.countDocuments.mockResolvedValue(41);

    const result = await service.getProducts({
      categoryId: '507f1f77bcf86cd799439011',
      page: 2,
      limit: 20,
      hasDiscount: true,
      inStock: true,
      minPrice: 2.5,
      maxPrice: 10,
      sort: 'price-low',
    });

    const mongoFilter = mockProductModel.find.mock.calls[0][0];
    expect(mongoFilter).toEqual({
      isActive: true,
      categoryId: expect.any(Object),
      discountPercent: { $gt: 0 },
      stockCount: { $gt: 0 },
      salePrice: { $gte: 2.5, $lte: 10 },
    });
    expect(mongoFilter.categoryId.toString()).toBe('507f1f77bcf86cd799439011');
    expect(query.sort).toHaveBeenCalledWith({ salePrice: 1 });
    expect(query.skip).toHaveBeenCalledWith(20);
    expect(query.limit).toHaveBeenCalledWith(20);
    expect(mockProductModel.countDocuments).toHaveBeenCalledWith(mongoFilter);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 41,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('does not filter by discount or stock when those flags are false', async () => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    mockProductModel.find.mockReturnValue(query);
    mockProductModel.countDocuments.mockResolvedValue(0);

    await service.getProducts({
      page: 1,
      limit: 20,
      hasDiscount: false,
      inStock: false,
      sort: 'best-match',
    });

    expect(mockProductModel.find).toHaveBeenCalledWith({ isActive: true });
    expect(mockProductModel.countDocuments).toHaveBeenCalledWith({ isActive: true });
  });

  it('rejects an inverted price range without querying MongoDB', async () => {
    await expect(
      service.getProducts({
        page: 1,
        limit: 20,
        minPrice: 10,
        maxPrice: 2,
        sort: 'best-match',
      }),
    ).rejects.toThrow('Minimum price cannot be greater than maximum price');

    expect(mockProductModel.find).not.toHaveBeenCalled();
  });

  it('transforms explicit false query values to false booleans', () => {
    const query = plainToInstance(GetProductsDto, {
      hasDiscount: 'false',
      inStock: 'false',
    });

    expect(validateSync(query)).toHaveLength(0);
    expect(query.hasDiscount).toBe(false);
    expect(query.inStock).toBe(false);
  });

  it('ignores blank price bounds and preserves decimal bounds', () => {
    const query = plainToInstance(GetProductsDto, {
      minPrice: ' ',
      maxPrice: '10.75',
    });

    expect(validateSync(query)).toHaveLength(0);
    expect(query.minPrice).toBeUndefined();
    expect(query.maxPrice).toBe(10.75);
  });
});
