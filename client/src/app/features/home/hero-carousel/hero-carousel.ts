import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';

interface HeroSlide {
  id: string;
  subtitle: string;
  title: string;
  action: string;
  note: string;
  image: string;
}

@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero-carousel.html',
  styleUrl: './hero-carousel.css',
})
export class HeroCarouselComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly activeSlide = signal(0);
  readonly heroSlides: HeroSlide[] = [
    {
      id: 'carousel-2',
      subtitle: 'New customers',
      title: '$0 delivery fees on above $20 orders',
      action: 'Shop now',
      note: 'Min spend $20. No delivery or service fees apply.',
      image: '/assets/images/carousel-img-2.png',
    },
    {
      id: 'carousel-3',
      subtitle: 'Fresh picks daily',
      title: 'Build your week around produce that tastes better',
      action: 'Explore recipes',
      note: 'Seasonal groceries delivered when you need them.',
      image: '/assets/images/carosuel-img-3.png',
    },
    {
      id: 'carousel-1',
      subtitle: 'Feeding Everyone x instant',
      title: 'For 21M kids, summer break means no lunch',
      action: 'Donate groceries',
      note: 'Help families get fresh food this season.',
      image: '/assets/images/carousel-img-1.png',
    },
  ];

  constructor() {
    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.next());
  }

  previous(): void {
    this.activeSlide.update((index) => (index - 1 + this.heroSlides.length) % this.heroSlides.length);
  }

  next(): void {
    this.activeSlide.update((index) => (index + 1) % this.heroSlides.length);
  }

  select(index: number): void {
    this.activeSlide.set(index);
  }
}