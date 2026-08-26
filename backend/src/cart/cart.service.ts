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

    const mergedQuantities = new Map<string, number>();

    // Add existing user cart items
    if (userCart) {
      for (const item of userCart.items) {
        const productId = item.productId.toString();

        mergedQuantities.set(
          productId,
          (mergedQuantities.get(productId) ?? 0) + item.quantity,
        );
      }
    }

    // Add guest cart items
    for (const item of guestCart.items) {
      const productId = item.productId.toString();

      mergedQuantities.set(
        productId,
        (mergedQuantities.get(productId) ?? 0) + item.quantity,
      );
    }

    // Nothing to merge
    if (mergedQuantities.size === 0) {
      await this.cartModel.deleteOne({
        guestCartId,
      });

      return;
    }

    const productIds = Array.from(mergedQuantities.keys())
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    // Get current active products and their stock
    const products = await this.productModel
      .find({
        _id: {
          $in: productIds,
        },
        isActive: true,
      })
      .select('_id stockCount')
      .lean();

    const stockMap = new Map(
      products.map((product) => [product._id.toString(), product.stockCount]),
    );

    const mergedItems: {
      productId: Types.ObjectId;
      quantity: number;
    }[] = [];

    // Validate every product against current stock
    for (const [productId, requestedQuantity] of mergedQuantities.entries()) {
      const stockCount = stockMap.get(productId);

      // Product does not exist, is inactive, or is out of stock
      if (stockCount === undefined || stockCount <= 0) {
        continue;
      }

      // Never allow cart quantity to exceed available stock
      const quantity = Math.min(requestedQuantity, stockCount);

      if (quantity > 0) {
        mergedItems.push({
          productId: new Types.ObjectId(productId),
          quantity,
        });
      }
    }

    if (userCart) {
      // Update existing user cart
      await this.cartModel.updateOne(
        {
          userId: userObjectId,
        },
        {
          $set: {
            items: mergedItems,
          },
        },
      );
    } else {
      // Transfer guest cart to user
      await this.cartModel.updateOne(
        {
          guestCartId,
        },
        {
          $set: {
            userId: userObjectId,
            items: mergedItems,
          },
          $unset: {
            guestCartId: '',
          },
        },
      );

      return;
    }

    // Guest cart is no longer needed after merge
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
