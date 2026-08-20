import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { ProductService } from './product.service';
import { Product } from './schemas/product.schema';
import { Category } from '../category/schemas/category.schema';

describe('ProductService', () => {
  let service: ProductService;

  const mockProductModel = {};
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
