import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';

import { Order, OrderDocument } from './schemas/order.schema';
import { Cart, CartDocument } from '../cart/schemas/cart.schema';
import { Address, AddressDocument } from '../address/schemas/address.schema';
import { Product, ProductDocument } from '../product/schemas/product.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';

import { CreateOrderDto } from './dto/create-order.dto';

import { calculateCartTotals } from '../common/utils/cart.util';
import {
  PAYMENT_METHODS,
  PaymentMethod,
  ORDER_STATUS,
  OrderStatus,
  PAYMENT_STATUS,
} from '../common/constants/enums';

import { generateOrderNo } from '../common/utils/order.util';

import stripeClient from '../config/stripe.config';
import { ENV } from '../config/env.config';

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
        images: {
          url: string;
          publicId: string;
        }[];
        originalPrice: number;
        discountPercent: number;
        salePrice: number;
        stockCount: number;
      };
      quantity: number;
    }>;

    const totals = calculateCartTotals(items);

    const orderItems = items.map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
      image: item.productId.images?.[0]?.url ?? '',
      originalPrice: item.productId.originalPrice,
      discountPercent: item.productId.discountPercent,
      salePrice: item.productId.salePrice,
      quantity: item.quantity,
      isReviewed: false,
    }));

    const shippingAddress = {
      recipientName: address.recipientName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    };

    const order = await this.orderModel.create({
      userId: new Types.ObjectId(userId),
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
      await this.cartModel.deleteOne({
        userId: new Types.ObjectId(userId),
      });

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

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      orderItems.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.salePrice * 100),
        },
        quantity: item.quantity,
      }));

    if (totals.deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Delivery Fee',
          },
          unit_amount: Math.round(totals.deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    if (totals.tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
          },
          unit_amount: Math.round(totals.tax * 100),
        },
        quantity: 1,
      });
    }

    const user = await this.userModel
      .findById(new Types.ObjectId(userId))
      .select('email')
      .lean();

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user?.email,
      line_items: lineItems,

      metadata: {
        orderId: order._id.toString(),
      },

      success_url: `${ENV.FRONTEND_ORIGIN}/orders/${order._id}`,
      cancel_url: `${ENV.FRONTEND_ORIGIN}/checkout`,
    });

    return {
      order,
      stripeUrl: session.url,
    };
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

  async updateOrderStatus(
    userId: string,
    orderId: string,
    status: OrderStatus,
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      userId: new Types.ObjectId(userId),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const currentStatus = order.status;

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [ORDER_STATUS.PLACED]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],

      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.CANCELLED],

      [ORDER_STATUS.ASSIGNED]: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],

      [ORDER_STATUS.PACKED]: [ORDER_STATUS.OUT_FOR_DELIVERY],

      [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],

      [ORDER_STATUS.DELIVERED]: [],

      [ORDER_STATUS.CANCELLED]: [],
    };

    if (!allowedTransitions[currentStatus].includes(status)) {
      throw new BadRequestException(
        `Cannot change order status from ${currentStatus} to ${status}`,
      );
    }

    order.status = status;

    order.statusHistory.push({
      status,
      note: '',
      date: new Date(),
    });

    if (
      status === ORDER_STATUS.DELIVERED &&
      order.paymentStatus !== PAYMENT_STATUS.PAID
    ) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
    }

    await order.save();

    return {
      order,
    };
  }

  async getAllOrdersForAdmin(status?: OrderStatus, page = 1, limit = 10) {
    const filter: { status?: OrderStatus } = {};

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      this.orderModel.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminOrderById(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel
      .findById(new Types.ObjectId(orderId))
      .lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      order,
    };
  }

  async updateAdminOrderStatus(
    orderId: string,
    status: OrderStatus,
    note = '',
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findById(new Types.ObjectId(orderId));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const currentStatus = order.status;

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [ORDER_STATUS.PLACED]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],

      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.CANCELLED],

      [ORDER_STATUS.ASSIGNED]: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],

      [ORDER_STATUS.PACKED]: [ORDER_STATUS.OUT_FOR_DELIVERY],

      [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],

      [ORDER_STATUS.DELIVERED]: [],

      [ORDER_STATUS.CANCELLED]: [],
    };

    if (!allowedTransitions[currentStatus].includes(status)) {
      throw new BadRequestException(
        `Cannot change order status from ${currentStatus} to ${status}`,
      );
    }

    order.status = status;

    order.statusHistory.push({
      status,
      note,
      date: new Date(),
    });

    if (
      status === ORDER_STATUS.DELIVERED &&
      order.paymentStatus !== PAYMENT_STATUS.PAID
    ) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
    }

    await order.save();

    return {
      order,
    };
  }
}
