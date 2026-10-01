import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let service: ReviewService;

  const reviewModel = {
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  };

  const productModel = {
    findOne: jest.fn(),
  };

  const orderModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: getModelToken('Review'),
          useValue: reviewModel,
        },
        {
          provide: getModelToken('Order'),
          useValue: orderModel,
        },
        {
          provide: getModelToken('Product'),
          useValue: productModel,
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    jest.clearAllMocks();
  });

  it('returns rating breakdown counts for the product reviews', async () => {
    productModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'product-123' }),
      }),
    });

    reviewModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([
                { _id: 'r1', rating: 5, comment: 'Loved it', createdAt: '2024-01-01T00:00:00.000Z' },
                { _id: 'r2', rating: 4, comment: 'Good', createdAt: '2024-01-02T00:00:00.000Z' },
              ]),
            }),
          }),
        }),
      }),
    });

    reviewModel.countDocuments.mockResolvedValue(2);
    reviewModel.aggregate.mockResolvedValue([
      { _id: 5, count: 1 },
      { _id: 4, count: 1 },
    ]);

    const result = await service.getProductReviews({
      slug: 'sample-product',
      page: 1,
      limit: 10,
    });

    expect(result.ratingBreakdown).toEqual([
      { rating: 5, count: 1 },
      { rating: 4, count: 1 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 },
    ]);
    expect(result.reviews).toHaveLength(2);
  });
});
