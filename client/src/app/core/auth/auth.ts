// import { Injectable, signal } from '@angular/core';
// import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
// import { catchError, map, of, switchMap, tap } from 'rxjs';

// import { normalizeApiError, type ApiError } from '../api/api-error';
// import { CartService } from '../cart/cart';

// export type AuthRole = 'user' | 'admin';

// export type AuthUser = {
//   _id: string;
//   name: string;
//   email: string;
//   role?: AuthRole;
//   avatar?: string | null;
//   phone?: string;
//   isAdmin?: boolean;
// };

// export type LoginRequest = {
//   email: string;
//   password: string;
// };

// export type RegisterRequest = {
//   name: string;
//   email: string;
//   password: string;
//   phone?: string;
//   avatar?: string;
// };

// export type AuthResponse = {
//   message: string;
//   user: AuthUser;
// };

// export type AuthStatusResponse = {
//   message: string;
//   user: AuthUser;
// };

// @Injectable({ providedIn: 'root' })
// export class AuthService {
//   readonly currentUser = signal<AuthUser | null>(null);
//   readonly isAuthenticated = signal<boolean>(false);
//   readonly isLoading = signal<boolean>(false);
//   readonly authError = signal<ApiError | null>(null);

//   constructor(
//     private readonly http: HttpClient,
//     private readonly cartService: CartService,
//   ) { }

//   private readonly httpOptions = {
//     headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
//     withCredentials: true,
//   };

//   login(data: LoginRequest) {
//     this.isLoading.set(true);
//     this.authError.set(null);

//     return this.http
//       .post<AuthResponse>('/api/auth/login', data, this.httpOptions)
//       .pipe(
//         tap((response) => this.setAuthenticatedUser(response.user)),
//         switchMap((response) => {
//           this.cartService.resetSessionState();
//           return this.cartService.loadCart().pipe(
//             map(() => response),
//             catchError(() => of(response)),
//           );
//         }),
//         tap(() => this.isLoading.set(false)),
//         catchError((error: HttpErrorResponse) => {
//           this.authError.set(normalizeApiError(error));
//           this.clearAuthenticatedUser();
//           this.isLoading.set(false);
//           throw error;
//         }),
//       );
//   }

//   register(data: RegisterRequest) {
//     this.isLoading.set(true);
//     this.authError.set(null);

//     return this.http
//       .post<AuthResponse>('/api/auth/register', data, this.httpOptions)
//       .pipe(
//         tap((response) => this.setAuthenticatedUser(response.user)),
//         switchMap((response) => {
//           this.cartService.resetSessionState();
//           return this.cartService.loadCart().pipe(
//             map(() => response),
//             catchError(() => of(response)),
//           );
//         }),
//         tap(() => this.isLoading.set(false)),
//         catchError((error: HttpErrorResponse) => {
//           this.authError.set(normalizeApiError(error));
//           this.clearAuthenticatedUser();
//           this.isLoading.set(false);
//           throw error;
//         }),
//       );
//   }

//   logout() {
//     this.isLoading.set(true);
//     this.authError.set(null);

//     return this.http
//       .post<{ message: string }>('/api/auth/logout', {}, this.httpOptions)
//       .pipe(
//         tap(() => {
//           this.clearAuthenticatedUser();
//           this.cartService.resetSessionState();
//         }),
//         map((response) => {
//           this.isLoading.set(false);
//           return response;
//         }),
//         catchError((error: HttpErrorResponse) => {
//           this.authError.set(normalizeApiError(error));
//           this.isLoading.set(false);
//           throw error;
//         }),
//       );
//   }

//   loadCurrentUser() {
//     this.isLoading.set(true);
//     this.authError.set(null);

//     return this.http.get<AuthStatusResponse>('/api/auth/status', this.httpOptions).pipe(
//       map((response) => {
//         const user = response.user ?? null;
//         this.setAuthenticatedUser(user);
//         this.isLoading.set(false);
//         return user;
//       }),
//       catchError((error: HttpErrorResponse) => {
//         this.authError.set(normalizeApiError(error));
//         this.clearAuthenticatedUser();
//         this.isLoading.set(false);
//         return of(null);
//       }),
//     );
//   }

//   private setAuthenticatedUser(user: AuthUser | null): void {
//     const nextUser = user
//       ? {
//         ...user,
//         isAdmin: user.role === 'admin' || user.isAdmin === true,
//       }
//       : null;

//     this.currentUser.set(nextUser);
//     this.isAuthenticated.set(Boolean(nextUser));
//   }

//   private clearAuthenticatedUser(): void {
//     this.currentUser.set(null);
//     this.isAuthenticated.set(false);
//   }
// }
