import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

export type PaymentMethod = 'cash_on_delivery' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus =
  'placed' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';

export function normalizeOrderStatus(status?: string | null): OrderStatus {
  if (status === 'assigned') {
    return 'packed';
  }

  switch (status) {
    case 'placed':
    case 'confirmed':
    case 'packed':
    case 'out_for_delivery':
    case 'delivered':
    case 'cancelled':
      return status;
    default:
      return 'placed';
  }
}

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

export type CancelOrderRequest = {
  reason?: string;
};

export type CancelOrderResponse = {
  message: string;
  order: CreatedOrder;
  refunded: boolean;
  refundId?: string;
};

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private readonly http: HttpClient) {}

  private normalizeOrder(order: CreatedOrder): CreatedOrder {
    return {
      ...order,
      status: normalizeOrderStatus(order.status),
      statusHistory: order.statusHistory?.map((entry) => ({
        ...entry,
        status: normalizeOrderStatus(entry.status),
      })),
    };
  }

  createOrder(request: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>('/api/order', request);
  }

  getOrders(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>('/api/order').pipe(
      map((response) => ({
        ...response,
        orders: response.orders.map((order) => this.normalizeOrder(order)),
      })),
    );
  }

  getOrderById(id: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`/api/order/${encodeURIComponent(id)}`).pipe(
      map((response) => ({
        ...response,
        order: this.normalizeOrder(response.order),
      })),
    );
  }

  cancelOrder(id: string, request: CancelOrderRequest = {}): Observable<CancelOrderResponse> {
    return this.http.patch<CancelOrderResponse>(
      `/api/order/${encodeURIComponent(id)}/cancel`,
      request,
    );
  }
}
