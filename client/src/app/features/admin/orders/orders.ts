import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AdminService } from '../services/admin';
import type { CreatedOrder, OrderStatus } from '../../checkout/services/order';

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
  imports: [CommonModule],
  templateUrl: './orders.html',
})
export class AdminOrdersComponent {
  readonly service = inject(AdminService);
  readonly orders = signal<CreatedOrder[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly statuses = statuses;
  readonly pagination = signal<{
    page: number;
    totalPages: number;
    total: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  } | null>(null);
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
      error: () => this.error.set('Unable to load admin orders.'),
      complete: () => this.loading.set(false),
    });
  }
  update(order: CreatedOrder, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as OrderStatus;
    if (status === order.status) return;
    this.service
      .updateOrderStatus(order._id, status)
      .subscribe({
        next: () => this.load(),
        error: () => this.error.set('Unable to update order status.'),
      });
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
