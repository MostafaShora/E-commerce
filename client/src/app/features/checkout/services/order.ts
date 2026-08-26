import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type PaymentMethod = 'cash_on_delivery' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus =
  'placed' | 'confirmed' | 'assigned' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';

export type CreateOrderRequest = {
  addressId: string;
  paymentMethod: PaymentMethod;
};

export type OrderItem = {
  _id?: string;
  productId: string;
  name: string;
  image: string;
  originalPrice: number;
  discountPercent: number;
  salePrice: number;
  quantity: number;
  isReviewed?: boolean;
};

export type OrderAddress = {
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type OrderStatusHistory = {
  status: OrderStatus;
  note: string;
  date: string;
};

export type CreatedOrder = {
  _id: string;
  orderNo: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  total: number;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  statusHistory?: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderResponse = {
  message: string;
  order: CreatedOrder;
  stripeUrl: string | null;
};

export type OrdersResponse = {
  message: string;
  orders: CreatedOrder[];
};

export type OrderResponse = {
  message: string;
  order: CreatedOrder;
};

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private readonly http: HttpClient) {}

  createOrder(request: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>('/api/order', request);
  }

  getOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>('/api/order');
  }

  getOrderById(id: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`/api/order/${encodeURIComponent(id)}`);
  }
}
