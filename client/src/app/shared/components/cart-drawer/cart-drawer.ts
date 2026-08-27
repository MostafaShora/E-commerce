import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { CartService } from '../../../core/cart/cart';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthState } from '../../../core/auth/auth.state';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cart-drawer.html',
})
export class CartDrawerComponent {
  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  readonly authState = inject(AuthState);
  private readonly router = inject(Router);

  decrease(productId: string, quantity: number): void {
    this.cart.updateQuantity(productId, quantity - 1).subscribe();
  }

  increase(productId: string, quantity: number): void {
    this.cart.updateQuantity(productId, quantity + 1).subscribe();
  }

  checkout(): void {
    if (!this.auth.currentUser()) {
      this.authState.openAuth('login');
      return;
    }
    this.cart.close();
    void this.router.navigate(['/checkout']);
  }
}