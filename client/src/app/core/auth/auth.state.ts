import { Injectable, computed, signal } from '@angular/core';

import { type ApiError } from '../api/api-error';
import type { AuthUser } from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  readonly currentUser = signal<AuthUser | null>(null);

  readonly isLoading = signal(false);

  readonly authError = signal<ApiError | null>(null);

  readonly isAuthenticated = computed(
    () => this.currentUser() !== null
  );

  readonly isAdmin = computed(
    () => this.currentUser()?.role === 'admin' ||
      this.currentUser()?.isAdmin === true
  );

  setUser(user: AuthUser | null): void {
    if (!user) {
      this.currentUser.set(null);
      return;
    }

    this.currentUser.set({
      ...user,
      isAdmin: user.role === 'admin' || user.isAdmin === true,
    });
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