import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import {
  OrderService,
  type CreatedOrder,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from '../../checkout/services/order';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders-page.html',
})
export class OrdersPageComponent {
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<CreatedOrder[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.orderService
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.orders.set(response.orders ?? []),
        error: () => this.errorMessage.set('Unable to load your orders right now.'),
        complete: () => this.loading.set(false),
      });
  }

  statusLabel(status: OrderStatus): string {
    return status.replaceAll('_', ' ');
  }

  paymentLabel(status: PaymentMethod | PaymentStatus): string {
    return status.replaceAll('_', ' ');
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  }
}
