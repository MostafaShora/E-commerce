import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../services/admin';
import type { AdminAnalyticsResponse } from '../services/admin';
import type { CreatedOrder } from '../../checkout/services/order';
import { orderStatusClass, paymentStatusClass } from '../models/admin.model';
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
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly analytics = signal<AdminAnalyticsResponse | null>(null);
  readonly recentOrders = signal<CreatedOrder[]>([]);
  readonly orderStatusClass = orderStatusClass;
  readonly paymentStatusClass = paymentStatusClass;
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
        this.error.set('Unable to load dashboard statistics.');
        done();
      },
      complete: done,
    });
    this.service
      .getOrders(1, 7)
      .subscribe({
        next: (r) => this.recentOrders.set(r.orders ?? []),
        error: () => {
          this.error.set('Unable to load recent orders.');
          done();
        },
        complete: done,
      });
  }
}
