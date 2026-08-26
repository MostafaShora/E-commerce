import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type CatalogCategory, type CatalogProduct } from '../../../shared/models/catalog';
import { HomeService } from '../services/home';
import { CategoriesSectionComponent } from '../categories-section/categories-section';
import { DealsSectionComponent } from '../deals-section/deals-section';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CategoriesSectionComponent,
    DealsSectionComponent,
    ProductCardComponent,
  ],
  templateUrl: './home-page.html',
})
export class HomePageComponent {
  private readonly homeService = inject(HomeService);

  readonly categories = signal<CatalogCategory[]>([]);
  readonly deals = signal<CatalogProduct[]>([]);
  readonly moreProducts = signal<CatalogProduct[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly visibleProducts = computed(() => this.moreProducts().slice(0, 12));

  constructor() {
    this.loadHome();
  }

  private loadHome(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    let remaining = 3;
    const finish = () => {
      remaining -= 1;
      if (remaining === 0) {
        this.isLoading.set(false);
      }
    };

    this.homeService.getCategories().subscribe({
      next: (response) => this.categories.set(response.categories ?? []),
      error: () => this.errorMessage.set('Unable to load categories right now.'),
      complete: finish,
    });

    this.homeService.getDeals(6).subscribe({
      next: (response) => this.deals.set(response.products ?? []),
      error: () => this.errorMessage.set('Unable to load today’s deals.'),
      complete: finish,
    });

    this.homeService.getProducts(12).subscribe({
      next: (response) => this.moreProducts.set(response.products ?? []),
      error: () => this.errorMessage.set('Unable to load featured products.'),
      complete: finish,
    });
  }
}
