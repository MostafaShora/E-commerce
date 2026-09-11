import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';

import {
  catchError,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import {
  normalizeApiError,
} from '../api/api-error';

import { CartService } from '../cart/cart';

import { AuthState } from './auth.state';

import type {
  AuthResponse,
  AuthStatusResponse,
  LoginRequest,
  RegisterRequest,
  AuthUser,
} from './auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private hydration$?: Observable<AuthUser | null>;

  constructor(
    private readonly http: HttpClient,
    private readonly cartService: CartService,
    private readonly authStore: AuthState,
  ) {}

  get currentUser() {
    return this.authStore.currentUser;
  }

  get isLoading() {
    return this.authStore.isLoading;
  }

  get authError() {
    return this.authStore.authError;
  }

  get authStatus() {
    return this.authStore.status;
  }

  /**
   * Restores the cookie-backed session exactly once during application startup.
   * Guards use this same observable if navigation begins before initialization
   * has completed, so they never treat an unknown session as logged out.
   */
  initialize(): Observable<AuthUser | null> {
    if (!this.hydration$) {
      this.hydration$ = this.loadCurrentUser().pipe(
        switchMap((user) => user
          ? this.cartService.loadCart().pipe(
              map(() => user),
              catchError(() => of(user)),
            )
          : of(null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.hydration$;
  }

  login(data: LoginRequest) {
    this.startLoading();

    return this.http
      .post<AuthResponse>(
        '/api/auth/login',
        data,
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          this.authStore.setUser(response.user);
        }),

        switchMap((response) => {
          this.cartService.resetSessionState();

          return this.cartService.loadCart().pipe(
            map(() => response),
            catchError(() => of(response))
          );
        }),

        tap(() => {
          this.stopLoading();
        }),

        catchError((error: HttpErrorResponse) => {
          this.handleError(error);
          return throwError(() => error);
        })
      );
  }

  register(data: RegisterRequest) {
    this.startLoading();

    return this.http
      .post<AuthResponse>(
        '/api/auth/register',
        data,
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          this.authStore.setUser(response.user);
        }),

        switchMap((response) => {
          this.cartService.resetSessionState();

          return this.cartService.loadCart().pipe(
            map(() => response),
            catchError(() => of(response))
          );
        }),

        tap(() => {
          this.stopLoading();
        }),

        catchError((error: HttpErrorResponse) => {
          this.handleError(error);
          return throwError(() => error);
        })
      );
  }

  logout() {
    this.startLoading();

    return this.http
      .post<{ message: string }>(
        '/api/auth/logout',
        {},
        { withCredentials: true }
      )
      .pipe(
        tap(() => {
          this.authStore.clear();
          this.cartService.resetSessionState();
        }),

        tap(() => {
          this.stopLoading();
        }),

        catchError((error: HttpErrorResponse) => {
          this.handleError(error);
          return throwError(() => error);
        })
      );
  }

  loadCurrentUser() {
    this.authStore.beginInitialization();

    return this.http
      .get<AuthStatusResponse>(
        '/api/auth/status',
        { withCredentials: true }
      )
      .pipe(
        map((response) => {
          const user = response.user ?? null;

          this.authStore.setUser(user);

          return user;
        }),

        tap(() => {
          this.stopLoading();
        }),

        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            this.authStore.setUser(null);
          } else {
            this.authStore.setInitializationError(normalizeApiError(error));
          }
          this.stopLoading();

          return of(null);
        })
      );
  }

  private startLoading(): void {
    this.authStore.setLoading(true);
    this.authStore.setError(null);
  }

  private stopLoading(): void {
    this.authStore.setLoading(false);
  }

  private handleError(error: HttpErrorResponse): void {
    this.authStore.setError(
      normalizeApiError(error)
    );

    this.authStore.setUser(null);
    this.stopLoading();
  }
}
