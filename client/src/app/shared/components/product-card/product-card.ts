import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CartService } from '../../../core/cart/cart';
import type { CatalogProduct } from '../../../shared/models/catalog';
import { ButtonComponent } from '../../ui/button/button';
import { CardComponent } from '../../ui/card/card';
import { BadgeComponent } from '../../ui/badge/badge';
import { getProductImageUrl, onImageError } from '../../utils/image.util';
import { ProductRatingComponent } from '../product-rating/product-rating';

@Component({
  selector: 'app-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ButtonComponent, CardComponent, BadgeComponent, ProductRatingComponent],
  templateUrl: './product-card.html',
})
export class ProductCardComponent {
  readonly cart = inject(CartService);
  readonly product = input.required<CatalogProduct>();
  readonly addingToCart = signal(false);

  readonly productPath = computed(() => `/products/${this.product().slug}`);
  readonly imageUrl = computed(() => getProductImageUrl(this.product().images));
  readonly onImageError = onImageError;
  readonly hasDiscount = computed(
    () => this.product().originalPrice > this.product().salePrice,
  );

  readonly discountText = computed(() => {
    const item = this.product();

    if (item.discountLabel) {
      return item.discountLabel;
    }

    if (item.discountPercent > 0) {
      return `${item.discountPercent}% off`;
    }

    return '';
  });

  readonly stockStatus = computed(() => {
    const item = this.product();

    if (item.stockCount <= 0) {
      return {
        text: 'Out of stock',
        tone: 'text-red-600',
      };
    }

    if (item.stockCount <= 5) {
      return {
        text: `Only ${item.stockCount} left`,
        tone: 'text-amber-600',
      };
    }

    return {
      text: 'In stock',
      tone: 'text-emerald-600',
    };
  });

  formatPrice(value: number): { dollars: string; cents: string } {
    const whole = Math.floor(value);
    const cents = Math.round((value - whole) * 100)
      .toString()
      .padStart(2, '0');

    return {
      dollars: whole.toString(),
      cents,
    };
  }

  addToCart(): void {
    if (this.addingToCart()) {
      return;
    }

    this.addingToCart.set(true);
    this.cart
      .addProduct(this.product())
      .pipe(finalize(() => this.addingToCart.set(false)))
      .subscribe();
  }
}
