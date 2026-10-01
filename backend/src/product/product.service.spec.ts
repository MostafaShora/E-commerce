import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { ProductService } from './product.service';
import { Product } from './schemas/product.schema';
import { Category } from '../category/schemas/category.schema';

describe('ProductService', () => {
  let service: ProductService;

  const mockProductModel = {
    findOne: jest.fn(),
    find: jest.fn(),
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
});
