import { Component, inject } from '@angular/core';

import {
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMapPin,
  LucideShoppingBag,
  LucideStar,
  LucideStore,
} from '@lucide/angular';

import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { LanguageService } from '../../core/services/language';
import { ModeToggleComponent } from '../../shared/components/mode-toggle/mode-toggle';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ModeToggleComponent,

    LucideLayoutDashboard,
    LucideShoppingBag,
    LucideStar,
    LucideMapPin,
    LucideStore,
    LucideLogOut,
  ],
  templateUrl: './account-layout.html',
  styleUrl: './account-layout.css',
})
export class AccountLayout {
  readonly auth = inject(AuthService);
  readonly language = inject(LanguageService);

  logout(): void {
    this.auth.logout().subscribe();
  }
}