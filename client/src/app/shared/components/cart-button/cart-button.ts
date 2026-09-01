import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { CartService } from '../../../core/cart/cart';

@Component({
  selector: 'app-cart-button',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './cart-button.html',
})
export class CartButtonComponent {
  readonly cart = inject(CartService);
  open(): void {
	    this.cart.open();
  }
}