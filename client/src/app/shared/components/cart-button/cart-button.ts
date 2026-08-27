import { Component, inject } from '@angular/core';

import { CartService } from '../../../core/cart/cart';

@Component({
  selector: 'app-cart-button',
  standalone: true,
  templateUrl: './cart-button.html',
})
export class CartButtonComponent {
  readonly cart = inject(CartService);
  open(): void {
	    this.cart.open();
  }
}