import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type PaymentMethod = 'cash_on_delivery' | 'card';

export type CreateOrderRequest = {
  addressId: string;
  paymentMethod: PaymentMethod;
};

export type CreatedOrder = {
  _id: string;
  orderNo: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  status: string;
};

export type CreateOrderResponse = {
  message: string;
  order: CreatedOrder;
  stripeUrl: string | null;
};

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private readonly http: HttpClient) {}

  createOrder(request: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>('/api/order', request);
  }
}
