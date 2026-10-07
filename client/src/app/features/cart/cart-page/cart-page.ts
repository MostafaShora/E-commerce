import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LucideTrash2 } from '@lucide/angular';
import { RouterLink } from '@angular/router';

import { CartService } from '../../../core/cart/cart';
import { LanguageService } from '../../../core/services/language';
import { getProductImageUrl, onImageError } from '../../../shared/utils/image.util';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideTrash2],
  templateUrl: './cart-page.html',
})
export class CartPageComponent {
  readonly cart = inject(CartService);
  readonly language = inject(LanguageService);
  readonly getProductImageUrl = getProductImageUrl;
  readonly onImageError = onImageError;

  constructor() {
    this.cart.loadCart().subscribe();
  }

  decrease(productId: string, quantity: number): void {
    this.cart.updateQuantity(productId, quantity - 1).subscribe();
  }

  increase(productId: string, quantity: number): void {
    this.cart.updateQuantity(productId, quantity + 1).subscribe();
  }

  remove(productId: string): void {
    this.cart.removeProduct(productId).subscribe();
  }

  clear(): void {
    this.cart.clearCart().subscribe();
  }
}
