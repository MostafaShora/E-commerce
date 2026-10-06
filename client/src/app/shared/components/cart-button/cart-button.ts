import { Component, inject } from '@angular/core';
import { LucideShoppingCart } from '@lucide/angular';

import { CartService } from '../../../core/cart/cart';
import { LanguageService } from '../../../core/services/language';

@Component({
  selector: 'app-cart-button',
  standalone: true,
  imports: [LucideShoppingCart],
  templateUrl: './cart-button.html',
})
export class CartButtonComponent {
  readonly cart = inject(CartService);
  readonly language = inject(LanguageService);

  open(): void {
    this.cart.open();
  }
}
