import { BadRequestException, Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Cart, CartDocument } from './schemas/cart.schema';

import { Product, ProductDocument } from '../product/schemas/product.schema';

import { UpsertCartDto } from './dto/upsert-cart.dto';

import { calculateCartTotals } from '../common/utils/cart.util';

import { FREE_DELIVERY_THRESHOLD } from '../common/constants/constant';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async upsertCart(
    userId: string | null,
    guestCartId: string | null,
    data: UpsertCartDto,
  ) {
    if (!userId && !guestCartId) {
      throw new BadRequestException('User ID or guest cart ID is required');
    }

    const query: Record<string, unknown> = userId
      ? {
          userId: new Types.ObjectId(userId),
        }
      : {
          guestCartId,
        };

    const validItems: {
      productId: Types.ObjectId;
      quantity: number;
    }[] = [];

    const seenIds = new Set<string>();

    for (const item of data.items) {
      if (!item.productId || !Types.ObjectId.isValid(item.productId)) {
        continue;
      }

      if (seenIds.has(item.productId)) {
        continue;
      }

      seenIds.add(item.productId);

      validItems.push({
        productId: new Types.ObjectId(item.productId),
        quantity: item.quantity,
      });
    }

    // No valid products
    if (validItems.length === 0) {
      await this.cartModel.findOneAndUpdate(
        query,
        {
          $set: {
            items: [],
          },
        },
        {
          upsert: true,
        },
      );

      return this.emptyCartResponse();
    }

    // Get active products
    const products = await this.productModel
      .find({
        _id: {
          $in: validItems.map((item) => item.productId),
        },
        isActive: true,
      })
      .select(
        'name slug images salePrice originalPrice discountPercent stockCount',
      )
      .lean();

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    const filteredItems: {
      productId: Types.ObjectId;
      quantity: number;
    }[] = [];

    for (const item of validItems) {
      const product = productMap.get(item.productId.toString());

      if (!product) {
        continue;
      }

      filteredItems.push({
        productId: item.productId,

        quantity: Math.min(item.quantity, product.stockCount),
      });
    }

    // All products invalid / inactive
    if (filteredItems.length === 0) {
      await this.cartModel.findOneAndUpdate(
        query,
        {
          $set: {
            items: [],
          },
        },
        {
          upsert: true,
        },
      );

      return this.emptyCartResponse();
    }

    const update: Record<string, unknown> = {
      $set: {
        items: filteredItems,
      },
    };

    // User cart should no longer have guestCartId
    if (userId) {
      update.$unset = {
        guestCartId: '',
      };
    }

    const cart = await this.cartModel
      .findOneAndUpdate(query, update, {
        upsert: true,
        new: true,
      })
      .populate({
        path: 'items.productId',
        select:
          'name slug images salePrice originalPrice discountPercent stockCount',
      })
      .lean();

    if (!cart) {
      throw new BadRequestException('Failed to upsert cart');
    }

    const populatedItems = cart.items as unknown as Array<{
      productId: {
        salePrice: number;
        [key: string]: unknown;
      };
      quantity: number;
    }>;

    const totals = calculateCartTotals(populatedItems);

    return {
      cart,
      ...totals,
    };
  }

  async getCart(userId: string | null, guestCartId: string | null) {
    if (!userId && !guestCartId) {
      throw new BadRequestException('User ID or guest cart ID is required');
    }

    const query: Record<string, unknown> = userId
      ? {
          userId: new Types.ObjectId(userId),
        }
      : {
          guestCartId,
        };

    const cart = await this.cartModel
      .findOne(query)
      .populate({
        path: 'items.productId',
        select:
          'name slug images salePrice originalPrice discountPercent stockCount',
      })
      .lean();

    if (!cart || !cart.items || cart.items.length === 0) {
      return this.emptyCartResponse();
    }

    const populatedItems = cart.items as unknown as Array<{
      productId: {
        salePrice: number;
        [key: string]: unknown;
      };
      quantity: number;
    }>;

    const totals = calculateCartTotals(populatedItems);

    return {
      cart,
      ...totals,
    };
  }

  async mergeGuestCart(userId: string, guestCartId: string | null) {
    if (!guestCartId) {
      return;
    }

    const guestCart = await this.cartModel.findOne({
      guestCartId,
    });

    if (!guestCart || guestCart.items.length === 0) {
      return;
    }

    const userObjectId = new Types.ObjectId(userId);

    const userCart = await this.cartModel.findOne({
      userId: userObjectId,
    });

    // User has no cart
    if (!userCart) {
      await this.cartModel.updateOne(
        {
          guestCartId,
        },
        {
          $set: {
            userId: userObjectId,
          },
          $unset: {
            guestCartId: '',
          },
        },
      );

      return;
    }

    const mergedItems = new Map<string, number>();

    // Existing user cart
    for (const item of userCart.items) {
      mergedItems.set(item.productId.toString(), item.quantity);
    }

    // Guest cart
    for (const item of guestCart.items) {
      const productId = item.productId.toString();

      const existing = mergedItems.get(productId);

      if (existing) {
        mergedItems.set(productId, existing + item.quantity);
      } else {
        mergedItems.set(productId, item.quantity);
      }
    }

    const items = Array.from(mergedItems.entries()).map(
      ([productId, quantity]) => ({
        productId: new Types.ObjectId(productId),
        quantity,
      }),
    );

    await this.cartModel.updateOne(
      {
        userId: userObjectId,
      },
      {
        $set: {
          items,
        },
      },
    );

    await this.cartModel.deleteOne({
      guestCartId,
    });
  }

  private emptyCartResponse() {
    return {
      cart: {
        items: [],
      },
      subtotal: 0,
      deliveryFee: 0,
      tax: 0,
      orderTotal: 0,
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    };
  }
}
