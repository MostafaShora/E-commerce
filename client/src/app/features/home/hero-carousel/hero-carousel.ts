import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { LanguageService } from '../../../core/services/language';

interface HeroSlide {
  id: string;
  image: string;
}

@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [RouterLink, LucideChevronLeft, LucideChevronRight],
  templateUrl: './hero-carousel.html',
  styleUrl: './hero-carousel.css',
})
export class HeroCarouselComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly language = inject(LanguageService);
  readonly activeSlide = signal(0);
  readonly heroSlides: HeroSlide[] = [
    {
      id: 'carousel-2',
      image: '/assets/images/carousel-img-2.png',
    },
    {
      id: 'carousel-3',
      image: '/assets/images/carosuel-img-3.png',
    },
    {
      id: 'carousel-1',
      image: '/assets/images/carousel-img-1.png',
    },
  ];

  constructor() {
    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.next());
  }

  previous(): void {
    this.activeSlide.update(
      (index) => (index - 1 + this.heroSlides.length) % this.heroSlides.length,
    );
  }

  next(): void {
    this.activeSlide.update((index) => (index + 1) % this.heroSlides.length);
  }

  select(index: number): void {
    this.activeSlide.set(index);
  }
}
