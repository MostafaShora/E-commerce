import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
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

  const orderModel = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

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

  it('queries reviewable orders with an ObjectId user filter', async () => {
    const userId = '6a8ae89d46a94455f155e6fe';
    const lean = jest.fn().mockResolvedValue([
      {
        _id: 'order-1',
        orderNo: 'ORD-1',
        createdAt: new Date(),
        items: [
          { _id: 'item-1', isReviewed: false },
          { _id: 'item-2', isReviewed: true },
        ],
      },
    ]);
    const select = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ select });
    orderModel.find.mockReturnValue({ sort });

    const result = await service.getUserReviewableOrderItems(userId);
    const filter = orderModel.find.mock.calls[0][0];

    expect(filter.userId).toBeInstanceOf(Types.ObjectId);
    expect(filter.userId.toString()).toBe(userId);
    expect(filter.status).toBe('delivered');
    expect(filter.paymentStatus).toBe('paid');
    expect(result.orders[0].items.map((item) => item._id)).toEqual(['item-1']);
  });

  it('queries submitted reviews with an ObjectId user filter', async () => {
    const userId = '6a8ae89d46a94455f155e6fe';
    const lean = jest.fn().mockResolvedValue([]);
    const sort = jest.fn().mockReturnValue({ lean });
    const populate = jest.fn().mockReturnValue({ sort });
    reviewModel.find.mockReturnValue({ populate });

    await service.getUserReviews(userId);

    const filter = reviewModel.find.mock.calls[0][0];
    expect(filter.userId).toBeInstanceOf(Types.ObjectId);
    expect(filter.userId.toString()).toBe(userId);
  });

  it('queries review ownership with ObjectIds and rejects non-delivered orders', async () => {
    const userId = '6a8ae89d46a94455f155e6fe';
    const orderId = '6a8cc072ac2a24b55938ec11';
    const orderItemId = '6a8cc072ac2a24b55938ec12';
    orderModel.findOne.mockResolvedValue({ status: 'placed', paymentStatus: 'pending' });

    await expect(
      service.createReview(userId, { orderId, orderItemId, rating: 5 }),
    ).rejects.toThrow('Order must be delivered and paid to leave a review');

    const filter = orderModel.findOne.mock.calls[0][0];
    expect(filter._id).toBeInstanceOf(Types.ObjectId);
    expect(filter._id.toString()).toBe(orderId);
    expect(filter.userId).toBeInstanceOf(Types.ObjectId);
    expect(filter.userId.toString()).toBe(userId);
  });
});
