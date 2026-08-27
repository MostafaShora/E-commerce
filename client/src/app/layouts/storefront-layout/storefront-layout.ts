import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth';
import { CartService } from '../../core/cart/cart';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, RouterOutlet],
  templateUrl: './storefront-layout.html',
})
export class StorefrontLayout {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly searchForm = new FormGroup({
    query: new FormControl('', { nonNullable: true }),
  });

  constructor(private readonly router: Router) {}

  submitSearch(): void {
    const query = this.searchForm.controls.query.value.trim();
    void this.router.navigate(['/search-results'], {
      queryParams: query ? { q: query } : {},
    });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/']),
    });
  }

  openCart(): void {
    this.cart.loadCart().subscribe();
    void this.router.navigate(['/cart']);
  }
}
