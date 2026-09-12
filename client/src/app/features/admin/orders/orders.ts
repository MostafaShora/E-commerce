import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
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
  imports: [CommonModule],
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
  readonly statusMenuOpenId = signal<string | null>(null);
  readonly statusMenuOrder = signal<CreatedOrder | null>(null);
  readonly statusMenuPosition = signal({
    top: 0,
    left: 0,
  });
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
    this.service.updateOrderStatus(order._id, status).subscribe({
      next: (response) => {
        if (response.order) {
          this.orders.update((orders) =>
            orders.map((item) => (item._id === order._id ? response.order! : item)),
          );
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

  toggleStatusMenu(orderId: string, event: MouseEvent): void {
    if (this.statusMenuOpenId() === orderId) {
      this.closeStatusMenu();
      return;
    }

    const order = this.orders().find((item) => item._id === orderId);

    if (!order) {
      return;
    }

    const trigger = event.currentTarget as HTMLElement;

    const menuHeight = Math.min(
      this.statusOptions(order).length * 40 + 12,
      window.innerHeight - 32,
    );

    const menuWidth = 180;
    const margin = 24;

    const rect = trigger.getBoundingClientRect();

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    const needsScroll = spaceAbove < menuHeight + margin || spaceBelow < menuHeight + margin;

    const openMenu = () => {
      const updatedRect = trigger.getBoundingClientRect();

      let top = updatedRect.bottom + 8;

      // لو مفيش مساحة تحت
      if (top + menuHeight > window.innerHeight - 8) {
        top = updatedRect.top - menuHeight - 8;
      }

      let left = updatedRect.right - menuWidth;

      // منع خروج الـ dropdown من يمين الشاشة
      left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

      this.statusMenuPosition.set({
        top,
        left,
      });

      this.statusMenuOrder.set(order);
      this.statusMenuOpenId.set(orderId);
    };

    if (needsScroll) {
      trigger.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      window.setTimeout(openMenu, 400);
    } else {
      openMenu();
    }
  }

  closeStatusMenu(): void {
    this.statusMenuOpenId.set(null);
    this.statusMenuOrder.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (
      !target.closest('.order-status-dropdown') &&
      !target.closest('.order-status-menu')
    ) {
      this.closeStatusMenu();
    }
  }

selectStatus(order: CreatedOrder, status: OrderStatus): void {
  this.closeStatusMenu();

  if (status === order.status) {
    return;
  }

  this.update(order, status);
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
