import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../services/admin';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class AdminDashboardComponent {
  readonly service = inject(AdminService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly productTotal = signal(0);
  readonly orderTotal = signal(0);
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
    this.service
      .getProducts(1, 1)
      .subscribe({
        next: (r) => this.productTotal.set(r.pagination.total),
        error: () => this.error.set('Unable to load product overview.'),
        complete: done,
      });
    this.service
      .getOrders(1, 1)
      .subscribe({
        next: (r) => this.orderTotal.set(r.pagination.total),
        error: () => this.error.set('Unable to load order overview.'),
        complete: done,
      });
  }
}
