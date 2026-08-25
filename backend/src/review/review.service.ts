import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Review, ReviewDocument } from './schemas/review.schema';
import { Order, OrderDocument } from '../order/schemas/order.schema';
import { Product, ProductDocument } from '../product/schemas/product.schema';

import { CreateReviewDto } from './dto/create-review.dto';

import { ORDER_STATUS, PAYMENT_STATUS } from '../common/constants/enums';
import { GetProductReviewsDto } from './dto/get-product-reviews.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,

    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async createReview(userId: string, data: CreateReviewDto) {
    const { orderId, orderItemId, rating, comment } = data;

    if (
      !Types.ObjectId.isValid(orderId) ||
      !Types.ObjectId.isValid(orderItemId)
    ) {
      throw new BadRequestException('Invalid order or item ID');
    }

    const order = await this.orderModel.findOne({
      _id: orderId,
      userId,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.status !== ORDER_STATUS.DELIVERED ||
      order.paymentStatus !== PAYMENT_STATUS.PAID
    ) {
      throw new BadRequestException(
        'Order must be delivered and paid to leave a review',
      );
    }

    const orderItem = order.items.find(
      (item) => item._id?.toString() === orderItemId,
    );

    if (!orderItem) {
      throw new NotFoundException('Order item not found in this order');
    }

    const existingReview = await this.reviewModel.findOne({
      orderItemId,
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this item');
    }

    const session = await this.reviewModel.db.startSession();

    try {
      const review = await session.withTransaction(async () => {
        try {
          const [createdReview] = await this.reviewModel.create(
            [
              {
                userId,
                orderId,
                orderItemId,
                productId: orderItem.productId,
                rating,
                comment,
              },
            ],
            { session },
          );

          if (!createdReview) {
            throw new BadRequestException('Failed to create review');
          }

          const updateOrderResult = await this.orderModel.updateOne(
            {
              _id: orderId,
              'items._id': orderItemId,
              'items.isReviewed': false,
            },
            {
              $set: {
                'items.$.isReviewed': true,
              },
            },
            { session },
          );

          if (updateOrderResult.modifiedCount === 0) {
            throw new BadRequestException(
              'Review status could not be updated for this order item',
            );
          }

          const [aggResult] = await this.reviewModel
            .aggregate([
              {
                $match: {
                  productId: orderItem.productId,
                },
              },
              {
                $group: {
                  _id: null,
                  averageRating: {
                    $avg: '$rating',
                  },
                  totalReviews: {
                    $sum: 1,
                  },
                },
              },
            ])
            .session(session);

          const newAverage =
            aggResult?.averageRating != null
              ? Math.round(aggResult.averageRating * 10) / 10
              : 0;

          const newCount = aggResult?.totalReviews ?? 0;

          const productUpdateResult = await this.productModel.updateOne(
            {
              _id: orderItem.productId,
            },
            {
              $set: {
                ratingAverage: newAverage,
                reviewCount: newCount,
              },
            },
            { session },
          );

          if (productUpdateResult.matchedCount === 0) {
            throw new NotFoundException('Product not found');
          }

          return createdReview;
        } catch (error) {
          if (
            error instanceof Error &&
            'code' in error &&
            (error as { code?: number }).code === 11000
          ) {
            throw new BadRequestException(
              'You have already reviewed this item',
            );
          }

          throw error;
        }
      });

      if (!review) {
        throw new BadRequestException('Failed to create review');
      }

      return {
        review,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getUserReviews(userId: string) {
    const reviews = await this.reviewModel
      .find({
        userId,
      })
      .populate('productId', 'name slug images')
      .sort({
        createdAt: -1,
      })
      .lean();

    return {
      reviews,
    };
  }

  async getUserReviewableOrderItems(userId: string) {
    const orders = await this.orderModel
      .find({
        userId,
        status: ORDER_STATUS.DELIVERED,
        paymentStatus: PAYMENT_STATUS.PAID,
        'items.isReviewed': false,
      })
      .sort({
        createdAt: -1,
      })
      .select('_id items orderNo createdAt')
      .lean();

    const filteredOrders = orders.map((order) => ({
      ...order,
      items: order.items.filter((item) => item.isReviewed === false),
    }));

    return {
      orders: filteredOrders,
    };
  }

  async getProductReviews(query: GetProductReviewsDto) {
    const { slug, page, limit } = query;

    const product = await this.productModel
      .findOne({
        slug,
        isActive: true,
      })
      .select('_id')
      .lean();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find({
          productId: product._id,
        })
        .populate('userId', 'name avatar')
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      this.reviewModel.countDocuments({
        productId: product._id,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      reviews,
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
}
