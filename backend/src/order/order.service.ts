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

      order.stockDeducted = true;
      await order.save();

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

    order.stripeSessionId = session.id;
    await order.save();

    return {
      order,
      stripeUrl: session.url,
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

  // async updateOrderStatus(
  //   userId: string,
  //   orderId: string,
  //   status: OrderStatus,
  // ) {
  //   if (!Types.ObjectId.isValid(orderId)) {
  //     throw new BadRequestException('Invalid order ID');
  //   }

  //   const order = await this.orderModel.findOne({
  //     _id: new Types.ObjectId(orderId),
  //     userId: new Types.ObjectId(userId),
  //   });

  //   if (!order) {
  //     throw new NotFoundException('Order not found');
  //   }

  //   const currentStatus = order.status;

  //   const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  //     [ORDER_STATUS.PLACED]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],

  //     [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.ASSIGNED, ORDER_STATUS.CANCELLED],

  //     [ORDER_STATUS.ASSIGNED]: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],

  //     [ORDER_STATUS.PACKED]: [ORDER_STATUS.OUT_FOR_DELIVERY],

  //     [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],

  //     [ORDER_STATUS.DELIVERED]: [],

  //     [ORDER_STATUS.CANCELLED]: [],
  //   };

  //   if (!allowedTransitions[currentStatus].includes(status)) {
  //     throw new BadRequestException(
  //       `Cannot change order status from ${currentStatus} to ${status}`,
  //     );
  //   }

  //   order.status = status;

  //   order.statusHistory.push({
  //     status,
  //     note: '',
  //     date: new Date(),
  //   });

  //   if (
  //     status === ORDER_STATUS.DELIVERED &&
  //     order.paymentStatus !== PAYMENT_STATUS.PAID
  //   ) {
  //     order.paymentStatus = PAYMENT_STATUS.PAID;
  //   }

  //   await order.save();

  //   return {
  //     order,
  //   };
  // }

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
      order.paymentMethod === PAYMENT_METHODS.CASH_ON_DELIVERY &&
      order.paymentStatus !== PAYMENT_STATUS.PAID
    ) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
    }

    await order.save();

    return {
      order,
    };
  }

  async handleStripePaymentSuccess(
    orderId: string,
    session: Stripe.Checkout.Session,
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findById(new Types.ObjectId(orderId));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Security check
    if (order.paymentMethod !== PAYMENT_METHODS.CARD) {
      throw new BadRequestException('Order is not a card payment order');
    }

    // Idempotency:
    // Stripe may send the same webhook more than once.
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      return {
        order,
        alreadyProcessed: true,
      };
    }

    // Make sure the Stripe session belongs to this order
    if (session.metadata?.orderId !== order._id.toString()) {
      throw new BadRequestException(
        'Stripe session metadata does not match order',
      );
    }

    // Make sure the Stripe session ID matches the one stored in the order
    if (order.stripeSessionId !== session.id) {
      throw new BadRequestException(
        'Stripe session does not belong to this order',
      );
    }

    // Make sure Stripe actually completed the checkout
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Stripe payment is not completed');
    }

    order.paymentStatus = PAYMENT_STATUS.PAID;

    order.stripeSessionId = session.id;

    if (typeof session.payment_intent === 'string') {
      order.stripePaymentIntentId = session.payment_intent;
    }

    order.paidAt = new Date();

    await order.save();

    // Clear cart only after successful payment
    await this.cartModel.deleteOne({
      userId: order.userId,
    });

    // Decrease stock only after successful payment
    await Promise.all(
      order.items.map((item) =>
        this.productModel.findByIdAndUpdate(item.productId, {
          $inc: {
            stockCount: -item.quantity,
          },
        }),
      ),
    );

    order.stockDeducted = true;
    await order.save();

    return {
      order,
      alreadyProcessed: false,
    };
  }

  async handleStripePaymentFailed(
    orderId: string,
    session: Stripe.Checkout.Session,
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findById(new Types.ObjectId(orderId));

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentMethod !== PAYMENT_METHODS.CARD) {
      throw new BadRequestException('Order is not a card payment order');
    }

    if (session.metadata?.orderId !== order._id.toString()) {
      throw new BadRequestException(
        'Stripe session metadata does not match order',
      );
    }

    if (order.stripeSessionId !== session.id) {
      throw new BadRequestException(
        'Stripe session does not belong to this order',
      );
    }

    // Never turn a successful payment into failed
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      return {
        order,
        alreadyPaid: true,
      };
    }

    order.paymentStatus = PAYMENT_STATUS.FAILED;

    await order.save();

    return {
      order,
      alreadyPaid: false,
    };
  }

  async cancelOrder(userId: string, orderId: string, reason = '') {
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

    // User can only cancel an order while it is still placed.
    if (order.status !== ORDER_STATUS.PLACED) {
      throw new BadRequestException(
        `Order cannot be cancelled from ${order.status} status`,
      );
    }

    // 1. CARD PAYMENT

    if (order.paymentMethod === PAYMENT_METHODS.CARD) {
      // Payment is still pending.
      // No refund is required because no money was captured.
      if (order.paymentStatus === PAYMENT_STATUS.PENDING) {
        order.status = ORDER_STATUS.CANCELLED;

        order.statusHistory.push({
          status: ORDER_STATUS.CANCELLED,
          note: reason,
          date: new Date(),
        });

        await order.save();

        return {
          order,
          refunded: false,
        };
      }

      // Payment failed previously.
      // Nothing needs to be refunded.
      if (order.paymentStatus === PAYMENT_STATUS.FAILED) {
        order.status = ORDER_STATUS.CANCELLED;

        order.statusHistory.push({
          status: ORDER_STATUS.CANCELLED,
          note: reason,
          date: new Date(),
        });

        await order.save();

        return {
          order,
          refunded: false,
        };
      }

      // Payment was already refunded.
      if (order.paymentStatus === PAYMENT_STATUS.REFUNDED) {
        throw new BadRequestException('Order has already been refunded');
      }

      // Payment is paid → Stripe refund is required.
      if (order.paymentStatus === PAYMENT_STATUS.PAID) {
        if (!order.stripePaymentIntentId) {
          throw new BadRequestException(
            'Cannot refund order: Stripe payment intent is missing',
          );
        }

        const refund = await stripeClient.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          metadata: {
            orderId: order._id.toString(),
            orderNo: order.orderNo,
          },
        });

        // Stripe refund request was successfully created.
        if (refund.status !== 'succeeded') {
          throw new BadRequestException(
            `Stripe refund was not completed. Refund status: ${refund.status}`,
          );
        }

        order.paymentStatus = PAYMENT_STATUS.REFUNDED;
        order.status = ORDER_STATUS.CANCELLED;

        order.statusHistory.push({
          status: ORDER_STATUS.CANCELLED,
          note: reason
            ? `${reason} | Refund ID: ${refund.id}`
            : `Refund ID: ${refund.id}`,
          date: new Date(),
        });

        // Restore stock only if it was previously deducted.
        if (order.stockDeducted) {
          await Promise.all(
            order.items.map((item) =>
              this.productModel.findByIdAndUpdate(item.productId, {
                $inc: {
                  stockCount: item.quantity,
                },
              }),
            ),
          );

          order.stockDeducted = false;
        }

        await order.save();

        return {
          order,
          refunded: true,
          refundId: refund.id,
        };
      }
    }

    // 2. CASH ON DELIVERY

    if (order.paymentMethod === PAYMENT_METHODS.CASH_ON_DELIVERY) {
      // COD should normally still be pending before delivery.
      // No Stripe refund is required.
      order.status = ORDER_STATUS.CANCELLED;

      order.statusHistory.push({
        status: ORDER_STATUS.CANCELLED,
        note: reason,
        date: new Date(),
      });

      // Stock was already deducted when the COD order was created.
      // Restore it only once.
      if (order.stockDeducted) {
        await Promise.all(
          order.items.map((item) =>
            this.productModel.findByIdAndUpdate(item.productId, {
              $inc: {
                stockCount: item.quantity,
              },
            }),
          ),
        );

        order.stockDeducted = false;
      }

      await order.save();

      return {
        order,
        refunded: false,
      };
    }

    throw new BadRequestException('Unsupported payment method');
  }
}
