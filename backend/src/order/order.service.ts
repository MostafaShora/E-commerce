import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Order, OrderDocument } from './schemas/order.schema';
import { Cart, CartDocument } from '../cart/schemas/cart.schema';
import { Address, AddressDocument } from '../address/schemas/address.schema';
import { Product, ProductDocument } from '../product/schemas/product.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';

import { CreateOrderDto } from './dto/create-order.dto';

import { calculateCartTotals } from '../common/utils/cart.util';
import { PAYMENT_METHODS, PaymentMethod } from '../common/constants/enums';

import { generateOrderNo } from '../common/utils/order.util';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,

    @InjectModel(Address.name)
    private readonly addressModel: Model<AddressDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createOrder(userId: string, data: CreateOrderDto) {
    const { addressId, paymentMethod } = data;

    const cart = await this.cartModel
      .findOne({
        userId: new Types.ObjectId(userId),
      })
      .populate({
        path: 'items.productId',
        select:
          'name slug images originalPrice discountPercent salePrice stockCount',
      });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const address = await this.addressModel.findOne({
      _id: addressId,
      userId: new Types.ObjectId(userId),
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const items = cart.items as unknown as Array<{
      productId: {
        _id: Types.ObjectId;
        name: string;
        images: string[];
        originalPrice: number;
        discountPercent: number;
        salePrice: number;
        stockCount: number;
      };
      quantity: number;
    }>;

    // Calculate totals
    const totals = calculateCartTotals(items);

    // Prepare order items
    const orderItems = items.map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
      image: item.productId.images?.[0] ?? '',
      originalPrice: item.productId.originalPrice,
      discountPercent: item.productId.discountPercent,
      salePrice: item.productId.salePrice,
      quantity: item.quantity,
      isReviewed: false,
    }));

    // Snapshot shipping address
    const shippingAddress = {
      recipientName: address.recipientName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    };

    // Create order
    const order = await this.orderModel.create({
      userId,
      orderNo: generateOrderNo(),
      items: orderItems,

      shippingAddress,

      paymentMethod: paymentMethod as PaymentMethod,

      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      tax: totals.tax,
      total: totals.orderTotal,
    });

    // Cash on delivery
    if (paymentMethod === PAYMENT_METHODS.CASH_ON_DELIVERY) {
      // Delete cart
      await this.cartModel.deleteOne({
        userId: new Types.ObjectId(userId),
      });

      // Decrease stock
      await Promise.all(
        items.map((item) =>
          this.productModel.findByIdAndUpdate(item.productId._id, {
            $inc: {
              stockCount: -item.quantity,
            },
          }),
        ),
      );

      return {
        order,
        stripeUrl: null,
      };
    }

    /*
     * Card payment
     *
     * Stripe integration can be added here.
     *
     * For now we return null so the order flow
     * works without Stripe.
     */
    return {
      order,
      stripeUrl: null,
    };
  }

  async getUserOrders(userId: string) {
    const orders = await this.orderModel
      .find({
        userId: new Types.ObjectId(userId),
      })
      .sort({
        createdAt: -1,
      })
      .lean();

    return {
      orders,
    };
  }

  async getUserOrderById(userId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(userId),
      })
      .lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      order,
    };
  }
}
