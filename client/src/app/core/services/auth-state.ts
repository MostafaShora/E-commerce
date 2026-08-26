import { Injectable, computed, effect, signal } from '@angular/core';

import { AuthService, type AuthUser } from '../auth/auth';

@Injectable({ providedIn: 'root' })
export class AuthState {
  readonly currentUser = signal<AuthUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isLoading = signal(false);

  constructor(private readonly authService: AuthService) {
    effect(() => {
      const user = this.authService.currentUser();
      this.currentUser.set(user ?? null);
    });

    effect(() => {
      this.isLoading.set(this.authService.isLoading());
    });
  }
}
