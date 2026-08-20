import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { CategoryService } from './category.service';
import { Category } from './schemas/category.schema';

describe('CategoryService', () => {
  let service: CategoryService;

  const mockCategoryModel = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
