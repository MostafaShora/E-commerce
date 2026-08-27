import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import type { CatalogProduct } from '../../../shared/models/catalog';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { HomeService } from '../services/home';

@Component({
  selector: 'app-product-sections',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './product-sections.html',
})
export class ProductSectionsComponent {
  private readonly homeService = inject(HomeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly products = signal<CatalogProduct[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.homeService
      .getProducts(12)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.products.set(response.products ?? []),
        error: () => this.errorMessage.set('Unable to load featured products right now.'),
        complete: () => this.loading.set(false),
      });
  }
}
