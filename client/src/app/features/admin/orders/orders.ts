import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { AdminService } from '../services/admin';
import type { CreatedOrder, OrderStatus } from '../../checkout/services/order';
import { orderStatusClass, paymentStatusClass } from '../models/admin.model';
import { NotificationService } from '../../../core/services/notification';
import { normalizeApiError } from '../../../core/api/api-error';

const statuses: OrderStatus[] = [
  'placed',
  'confirmed',
  'assigned',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled',
];
@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, MatSelectModule],
  templateUrl: './orders.html',
})
export class AdminOrdersComponent {
  readonly service = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  readonly orders = signal<CreatedOrder[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly statuses = statuses;
  readonly orderStatusClass = orderStatusClass;
  readonly paymentStatusClass = paymentStatusClass;
  readonly pagination = signal<{
    page: number;
    totalPages: number;
    total: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  } | null>(null);
  readonly updatingOrderId = signal<string | null>(null);
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.getOrders(this.page()).subscribe({
      next: (r) => {
        this.orders.set(r.orders);
        this.pagination.set(r.pagination);
      },
      error: (error: unknown) => this.error.set(normalizeApiError(error).message),
      complete: () => this.loading.set(false),
    });
  }
  update(order: CreatedOrder, status: OrderStatus): void {
    if (status === order.status) return;
    this.updatingOrderId.set(order._id);
    this.service
      .updateOrderStatus(order._id, status)
      .subscribe({
        next: (response) => {
          if (response.order) {
            this.orders.update((orders) => orders.map((item) => item._id === order._id ? response.order! : item));
            this.notifications.success(response.message);
          }
        },
        error: (error: unknown) => this.error.set(normalizeApiError(error).message),
        complete: () => this.updatingOrderId.set(null),
      });
  }
  statusOptions(order: CreatedOrder): OrderStatus[] {
    const used = new Set(order.statusHistory?.map((entry) => entry.status) ?? []);
    return statuses.filter((status) => status === order.status || !used.has(status));
  }
  statusLabel(status: OrderStatus): string {
    return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  nextPage(): void {
    if (this.pagination()?.hasNextPage) {
      this.page.update((value) => value + 1);
      this.load();
    }
  }
  previousPage(): void {
    if (this.pagination()?.hasPrevPage) {
      this.page.update((value) => value - 1);
      this.load();
    }
  }
}
