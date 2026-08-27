import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../../core/cart/cart';
import type { CatalogProduct } from '../../../shared/models/catalog';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
})
export class ProductCardComponent {
  readonly cart = inject(CartService);
  readonly product = input.required<CatalogProduct>();

  readonly productPath = computed(() => `/products/${this.product().slug}`);
  readonly imageUrl = computed(() => this.product().images?.[0] ?? '');
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

  readonly roundedRating = computed(() => Math.round(this.product().ratingAverage));

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
    this.cart.addProduct(this.product()).subscribe();
  }
}
