import { Component, inject } from '@angular/core';
import {
  LucideLayoutDashboard,
  LucidePackage,
  LucideTags,
  LucideShoppingBag,
  LucideStore,
  LucideLogOut,
} from '@lucide/angular';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LanguageService } from '../../core/services/language';
import { ModeToggleComponent } from '../../shared/components/mode-toggle/mode-toggle';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ModeToggleComponent,

    LucideLayoutDashboard,
    LucidePackage,
    LucideTags,
    LucideShoppingBag,
    LucideStore,
    LucideLogOut,
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  readonly auth = inject(AuthService);
  readonly language = inject(LanguageService);

  logout(): void {
    this.auth.logout().subscribe();
  }
}