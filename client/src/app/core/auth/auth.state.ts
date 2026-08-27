import { Injectable, computed, signal } from '@angular/core';

import type { ApiError } from '../api/api-error';
import type { AuthUser } from './auth.models';

export type AuthView = 'login' | 'register';

@Injectable({
  providedIn: 'root',
})
export class AuthState {
  readonly isAuthOpen = signal(false);
  readonly view = signal<AuthView>('login');
  readonly currentUser = signal<AuthUser | null>(null);
  readonly isLoading = signal(false);
  readonly authError = signal<ApiError | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(
    () => this.currentUser()?.role === 'admin' || this.currentUser()?.isAdmin === true,
  );

  openAuth(view: AuthView = 'login'): void {
    this.view.set(view);
    this.isAuthOpen.set(true);
  }

  closeAuth(): void {
    this.isAuthOpen.set(false);
  }

  setView(view: AuthView): void {
    this.view.set(view);
  }

  setUser(user: AuthUser | null): void {
    this.currentUser.set(
      user
        ? { ...user, isAdmin: user.role === 'admin' || user.isAdmin === true }
        : null,
    );
  }

  setLoading(value: boolean): void {
    this.isLoading.set(value);
  }

  setError(error: ApiError | null): void {
    this.authError.set(error);
  }

  clear(): void {
    this.currentUser.set(null);
    this.authError.set(null);
    this.isLoading.set(false);
  }
}