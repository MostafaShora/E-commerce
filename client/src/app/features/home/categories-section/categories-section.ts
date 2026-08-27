import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import type { CatalogCategory } from '../../../shared/models/catalog';
import { HomeService } from '../services/home';

@Component({
  selector: 'app-categories-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './categories-section.html',
})
export class CategoriesSectionComponent {
  private readonly homeService = inject(HomeService);
  private readonly destroyRef = inject(DestroyRef);
  readonly categories = signal<CatalogCategory[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.homeService.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => this.categories.set(response.categories ?? []),
      error: () => this.errorMessage.set('Unable to load categories right now.'),
      complete: () => this.loading.set(false),
    });
  }
}
