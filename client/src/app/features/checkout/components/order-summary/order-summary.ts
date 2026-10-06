import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { LanguageService } from '../../../../core/services/language';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import {
  LucideArrowLeft,
  LucideCheck,
  LucideClock3,
  LucideMapPin,
  LucidePackage,
  LucideReceipt,
  LucideTruck,
} from '@lucide/angular';

import {
  OrderService,
  type CreatedOrder,
} from '../../services/order';

interface OrderItem {
  _id?: string;
  productId?: string;
  name: string;
  image: string;
  quantity: number;
  originalPrice?: number;
  salePrice?: number;
  price?: number;
  total?: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
}

interface Order {
  _id: string;
  orderNo: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;

  items: OrderItem[];

  shippingAddress: ShippingAddress;

  subtotal?: number;
  deliveryFee?: number;
  tax?: number;
  total: number;

  statusHistory?: Array<{
    status: string;
    timestamp?: string;
    createdAt?: string;
  }>;
}

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideArrowLeft,
    LucideCheck,
    LucideClock3,
    LucideMapPin,
    LucidePackage,
    LucideReceipt,
    LucideTruck,
  ],
  templateUrl: './order-summary.html',
})
export class OrderSummaryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  readonly language = inject(LanguageService);

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadOrder();
  }

  loadOrder(): void {
    const orderId = this.route.snapshot.paramMap.get('id');

    if (!orderId) {
      this.error.set(this.language.t('orderConfirmation.loadError'));
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.orderService
      .getOrderById(orderId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.order.set(response.order);
        },
        error: () => {
          this.error.set(this.language.t('orderConfirmation.loadError'));
        },
      });
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.language.language() === 'ar' ? 'ar' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  }

  formatDateTime(value?: string): string {
    if (!value) return '';

    return new Intl.DateTimeFormat(this.language.language() === 'ar' ? 'ar' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }

  formatPrice(value = 0): string {
    return `$${value.toFixed(2)}`;
  }

  statusLabel(status: string): string {
    const key = status.toLowerCase().replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const path = `orders.status.${key}`;
    const translated = this.language.t(path);
    return translated === path
      ? status.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
      : translated;
  }

  paymentLabel(status: string): string {
    const path = `orderConfirmation.paymentStatuses.${status.toLowerCase()}`;
    const translated = this.language.t(path);
    return translated === path ? status.replaceAll('_', ' ') : translated;
  }

  paymentMethodLabel(method: string | undefined): string {
    if (!method) return this.language.t('orderConfirmation.card');
    const key = method.toLowerCase() === 'cash_on_delivery' ? 'cashOnDelivery' : method.toLowerCase();
    const path = `orders.paymentMethods.${key}`;
    const translated = this.language.t(path);
    return translated === path ? method.replaceAll('_', ' ') : translated;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700';

      case 'out_for_delivery':
        return 'bg-sky-50 text-sky-700';

      case 'packed':
      case 'assigned':
      case 'confirmed':
        return 'bg-amber-50 text-amber-700';

      case 'cancelled':
        return 'bg-red-50 text-red-700';

      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  isStatusReached(order: Order, status: string): boolean {
    const statuses = [
      'placed',
      'confirmed',
      'assigned',
      'packed',
      'out_for_delivery',
      'delivered',
    ];

    if (order.status === 'cancelled') {
      return false;
    }

    return statuses.indexOf(status) <= statuses.indexOf(order.status);
  }

  statusDate(order: Order, status: string): string | undefined {
    const entry = order.statusHistory?.find((item) => item.status === status);

    return entry?.timestamp ?? entry?.createdAt;
  }

  itemPrice(item: OrderItem): number {
    return item.salePrice ?? item.price ?? item.originalPrice ?? 0;
  }

  itemTotal(item: OrderItem): number {
    return item.total ?? this.itemPrice(item) * item.quantity;
  }

  retry(): void {
    this.loadOrder();
  }
}