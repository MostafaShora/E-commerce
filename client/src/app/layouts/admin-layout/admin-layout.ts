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

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,

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

  logout(): void {
    this.auth.logout().subscribe();
  }
}