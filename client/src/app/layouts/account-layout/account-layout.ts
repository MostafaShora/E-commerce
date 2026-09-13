import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  LucideArrowLeft,
  LucideClipboardList,
  LucideLogOut,
  LucideMapPin,
  LucideStar,
  LucideUserRound,
} from '@lucide/angular';

import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,

    LucideArrowLeft,
    LucideUserRound,
    LucideClipboardList,
    LucideStar,
    LucideMapPin,
    LucideLogOut,
  ],
  templateUrl: './account-layout.html',
  styleUrl: './account-layout.css',
})
export class AccountLayout {
  private readonly location = inject(Location);

  readonly auth = inject(AuthService);

  back(): void {
    this.location.back();
  }

  logout(): void {
    this.auth.logout().subscribe();
  }
}