import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../services/admin';
import type { AdminAnalyticsResponse } from '../services/admin';
import type { CreatedOrder } from '../../checkout/services/order';
import { orderStatusClass, paymentStatusClass } from '../models/admin.model';
import { LanguageService } from '../../../core/services/language';
import {
  LucideCircleAlert,
  LucideDollarSign,
  LucidePackage,
  LucideShoppingBag,
} from '@lucide/angular';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideCircleAlert,
    LucideDollarSign,
    LucidePackage,
    LucideShoppingBag,
  ],
  templateUrl: './dashboard.html',
})
export class AdminDashboardComponent {
  readonly service = inject(AdminService);
  readonly language = inject(LanguageService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly analytics = signal<AdminAnalyticsResponse | null>(null);
  readonly recentOrders = signal<CreatedOrder[]>([]);
  readonly orderStatusClass = orderStatusClass;
  readonly paymentStatusClass = paymentStatusClass;
  orderStatusLabel(status: string): string {
    const key = status.toLowerCase().replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const path = `orders.status.${key}`;
    const translated = this.language.t(path);
    return translated === path ? status.replaceAll('_', ' ') : translated;
  }

  paymentStatusLabel(status: string): string {
    const path = `orders.paymentStatuses.${status.toLowerCase()}`;
    const translated = this.language.t(path);
    return translated === path ? status.replaceAll('_', ' ') : translated;
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.language.language() === 'ar' ? 'ar' : 'en-US', {
      dateStyle: 'medium',
    }).format(new Date(value));
  }

  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    let pending = 2;
    const done = () => {
      pending -= 1;
      if (!pending) this.loading.set(false);
    };
    this.service.getAnalytics().subscribe({
      next: (r) => this.analytics.set(r),
      error: () => {
        this.error.set(this.language.t('adminDashboard.statisticsError'));
        done();
      },
      complete: done,
    });
    this.service
      .getOrders(1, 7)
      .subscribe({
        next: (r) => this.recentOrders.set(r.orders ?? []),
        error: () => {
          this.error.set(this.language.t('adminDashboard.recentOrdersError'));
          done();
        },
        complete: done,
      });
  }
}
