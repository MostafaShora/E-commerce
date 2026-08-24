import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import {
  ORDER_STATUS_VALUES,
  PAYMENT_METHOD_VALUES,
  PAYMENT_STATUS_VALUES,
  ORDER_STATUS,
  PAYMENT_STATUS,
} from '../../common/constants/enums';

import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../common/constants/enums';

export type OrderDocument = HydratedDocument<Order>;

@Schema()
export class OrderItem {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
  })
  image: string;

  @Prop({
    type: Number,
    required: true,
  })
  originalPrice: number;

  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  discountPercent: number;

  @Prop({
    type: Number,
    required: true,
  })
  salePrice: number;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  isReviewed: boolean;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({
  _id: false,
})
export class OrderAddress {
  @Prop({ type: String, required: true })
  recipientName: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, required: true })
  street: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: true })
  state: string;

  @Prop({ type: String, required: true })
  postalCode: string;

  @Prop({ type: String, required: true })
  country: string;
}

export const OrderAddressSchema = SchemaFactory.createForClass(OrderAddress);

@Schema({
  _id: false,
})
export class OrderStatusHistory {
  @Prop({
    type: String,
    enum: ORDER_STATUS_VALUES,
    required: true,
  })
  status: OrderStatus;

  @Prop({
    type: String,
    default: '',
  })
  note: string;

  @Prop({
    type: Date,
    default: Date.now,
  })
  date: Date;
}

export const OrderStatusHistorySchema =
  SchemaFactory.createForClass(OrderStatusHistory);

@Schema({
  timestamps: true,
})
export class Order {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  orderNo: string;

  @Prop({
    type: [OrderItemSchema],
    required: true,
  })
  items: OrderItem[];

  @Prop({
    type: OrderAddressSchema,
    required: true,
  })
  shippingAddress: OrderAddress;

  @Prop({
    type: String,
    enum: PAYMENT_METHOD_VALUES,
    required: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: String,
    enum: PAYMENT_STATUS_VALUES,
    default: PAYMENT_STATUS.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Prop({
    type: String,
    default: null,
    unique: true,
    sparse: true,
  })
  stripeSessionId?: string;

  @Prop({
    type: String,
    default: null,
  })
  stripePaymentIntentId?: string;

  @Prop({
    type: Date,
    default: null,
  })
  paidAt?: Date;

  @Prop({
    type: String,
    enum: ORDER_STATUS_VALUES,
    default: ORDER_STATUS.PLACED,
  })
  status: OrderStatus;

  @Prop({
    type: [OrderStatusHistorySchema],
    default: () => [
      {
        status: ORDER_STATUS.PLACED,
        date: new Date(),
      },
    ],
  })
  statusHistory: OrderStatusHistory[];

  @Prop({
    type: Number,
    required: true,
  })
  subtotal: number;

  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  deliveryFee: number;

  @Prop({
    type: Number,
    required: true,
  })
  tax: number;

  @Prop({
    type: Number,
    required: true,
  })
  total: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
