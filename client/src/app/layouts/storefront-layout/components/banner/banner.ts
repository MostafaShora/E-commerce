import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-storefront-banner',
  standalone: true,
  templateUrl: './banner.html',
})
export class BannerComponent {
  readonly isVisible = signal(sessionStorage.getItem('instant-promo-banner-dismissed') !== 'true');

  dismiss(): void {
    sessionStorage.setItem('instant-promo-banner-dismissed', 'true');
    this.isVisible.set(false);
  }
}
