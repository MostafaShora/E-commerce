import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

import { Review, ReviewSchema } from './schemas/review.schema';
import { Order, OrderSchema } from '../order/schemas/order.schema';
import { Product, ProductSchema } from '../product/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Review.name,
        schema: ReviewSchema,
      },
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],

  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
