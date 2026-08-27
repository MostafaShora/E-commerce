import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { AuthState } from '../../../../core/auth/auth.state';
import { CartButtonComponent } from '../../../../shared/components/cart-button/cart-button';
import { LogoComponent } from '../../../../shared/components/logo/logo';
import { ModeToggleComponent } from '../../../../shared/components/mode-toggle/mode-toggle';

@Component({
  selector: 'app-storefront-nav',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, ModeToggleComponent, CartButtonComponent],
  templateUrl: './nav.html',
})
export class StorefrontNavComponent {
  readonly auth = inject(AuthService);
  readonly authState = inject(AuthState);
  readonly searchForm = new FormGroup({
    query: new FormControl('', { nonNullable: true }),
  });
  private readonly router = inject(Router);

  submitSearch(): void {
    const query = this.searchForm.controls.query.value.trim();
    void this.router.navigate(['/search-results'], { queryParams: query ? { q: query } : {} });
  }

  openAuth(): void {
    this.authState.openAuth('login');
  }

  logout(): void {
    this.auth.logout().subscribe({ next: () => void this.router.navigate(['/']) });
  }
}
