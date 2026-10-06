import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LanguageService } from '../../../core/services/language';
import type { CatalogProduct } from '../../../shared/models/catalog';
import { HomeService } from '../services/home';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';

@Component({
  selector: 'app-deals-section',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './deals-section.html',
})
export class DealsSectionComponent {
  private readonly homeService = inject(HomeService);
  private readonly destroyRef = inject(DestroyRef);
  readonly language = inject(LanguageService);
  readonly products = signal<CatalogProduct[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadDeals();
  }

  loadDeals(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.homeService.getDeals(6).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => this.products.set(response.products ?? []),
      error: () => this.errorMessage.set(this.language.t('home.dealsError')),
      complete: () => this.loading.set(false),
    });
  }
}
