import { Component, computed, inject, signal } from '@angular/core';
import { LucideX } from '@lucide/angular';

import { LanguageService } from '../../../../core/services/language';

@Component({
  selector: 'app-storefront-banner',
  standalone: true,
  imports: [LucideX],
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})
export class BannerComponent {
  readonly language = inject(LanguageService);
  readonly tickerText = computed(() => this.language.t('promo.deliveryMessage'));
  readonly isVisible = signal(
    sessionStorage.getItem('instant-promo-banner-dismissed') !== 'true',
  );

  dismiss(): void {
    sessionStorage.setItem('instant-promo-banner-dismissed', 'true');
    this.isVisible.set(false);
  }
}
