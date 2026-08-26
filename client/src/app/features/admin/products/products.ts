import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AdminService } from '../services/admin';
import type { CatalogProduct } from '../../../shared/models/catalog';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.html',
})
export class AdminProductsComponent {
  readonly service = inject(AdminService);
  readonly products = signal<CatalogProduct[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
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
    this.service.getProducts(this.page()).subscribe({
      next: (r) => {
        this.products.set(r.products);
        this.pagination.set(r.pagination);
      },
      error: () => this.error.set('Unable to load admin products.'),
      complete: () => this.loading.set(false),
    });
  }
  toggle(product: CatalogProduct): void {
    this.service
      .toggleProduct(product._id, !this.isActive(product))
      .subscribe({
        next: () => this.load(),
        error: () => this.error.set('Unable to change product status.'),
      });
  }
  remove(product: CatalogProduct): void {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    this.service
      .deleteProduct(product._id)
      .subscribe({
        next: () => this.load(),
        error: () => this.error.set('Unable to delete product.'),
      });
  }
  isActive(product: CatalogProduct): boolean {
    return (product as CatalogProduct & { isActive?: boolean }).isActive !== false;
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
