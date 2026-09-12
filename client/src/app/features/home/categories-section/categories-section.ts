import {
  Component,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import {
  LucideArrowLeft,
  LucideArrowRight,
} from '@lucide/angular';

import { EmblaCarouselDirective } from 'embla-carousel-angular';

import type { CatalogCategory } from '../../../shared/models/catalog';
import { HomeService } from '../services/home';

@Component({
  selector: 'app-categories-section',
  standalone: true,
  imports: [
    RouterLink,
    EmblaCarouselDirective,
    LucideArrowLeft,
    LucideArrowRight,
  ],
  templateUrl: './categories-section.html',
})
export class CategoriesSectionComponent {
  private readonly homeService = inject(HomeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<CatalogCategory[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly emblaRef =
    viewChild<EmblaCarouselDirective>(EmblaCarouselDirective);

  readonly emblaOptions = {
    align: 'start' as const,
    containScroll: 'trimSnaps' as const,
    dragFree: false,
    loop: true,
  };

  private autoSlideInterval?: ReturnType<typeof setInterval>;

  constructor() {
    this.loadCategories();

    this.destroyRef.onDestroy(() => {
      this.stopAutoSlide();
    });
  }

  loadCategories(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.homeService
      .getCategories()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.categories.set(response.categories ?? []);

          if (this.categories().length > 0) {
            this.startAutoSlide();
          }
        },

        error: () => {
          this.errorMessage.set(
            'Unable to load categories right now.',
          );

          this.stopAutoSlide();
        },
      });
  }

  private startAutoSlide(): void {
    this.stopAutoSlide();

    this.autoSlideInterval = setInterval(() => {
      this.next();
    }, 3000);
  }

  private stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = undefined;
    }
  }

  previous(): void {
    this.emblaRef()?.goToPrev();
  }

  next(): void {
    this.emblaRef()?.goToNext();
  }
}