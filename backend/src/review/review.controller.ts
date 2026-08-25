import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetProductReviewsDto } from './dto/get-product-reviews.dto';

@Controller('review')
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async createReview(@Req() req: Request, @Body() data: CreateReviewDto) {
    const user = req.user as {
      _id: string;
    };

    const result = await this.reviewService.createReview(
      user._id.toString(),
      data,
    );

    return {
      message: 'Review created successfully',
      ...result,
    };
  }

  @Get()
  async getUserReviews(@Req() req: Request) {
    const user = req.user as {
      _id: string;
    };

    const result = await this.reviewService.getUserReviews(user._id.toString());

    return {
      message: 'Reviews retrieved successfully',
      ...result,
    };
  }

  @Get('reviewable')
  async getUserReviewableOrderItems(@Req() req: Request) {
    const user = req.user as {
      _id: string;
    };

    const result = await this.reviewService.getUserReviewableOrderItems(
      user._id.toString(),
    );

    return {
      message: 'Reviewable order items retrieved successfully',
      ...result,
    };
  }

  @Get('product')
  async getProductReviews(@Query() query: GetProductReviewsDto) {
    const result = await this.reviewService.getProductReviews(query);

    return {
      message: 'Product reviews retrieved successfully',
      ...result,
    };
  }
}
