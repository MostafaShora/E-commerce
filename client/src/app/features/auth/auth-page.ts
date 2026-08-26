import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService, type LoginRequest, type RegisterRequest } from '../../core/auth/auth';
import { LoginFormComponent } from './login-form';
import { RegisterFormComponent } from './register-form';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, LoginFormComponent, RegisterFormComponent],
  template: `
    <main class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section class="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/80 sm:p-8">
        <div class="mb-6 flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Welcome</p>
            <h1 class="mt-2 text-2xl font-bold text-slate-900">Account access</h1>
          </div>
          <div class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {{ mode() === 'login' ? 'Login' : 'Register' }}
          </div>
        </div>

        @if (authErrorMessage) {
          <div class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ authErrorMessage }}
          </div>
        }

        @if (mode() === 'login') {
          <app-login-form
            [isSubmitting]="isSubmitting"
            (submitted)="handleLogin($event)"
          />
        } @else {
          <app-register-form
            [isSubmitting]="isSubmitting"
            (submitted)="handleRegister($event)"
          />
        }

        <div class="mt-6 text-center text-sm text-slate-600">
          @if (mode() === 'login') {
            <span>
              Need an account?
              <button type="button" class="ml-1 font-semibold text-slate-900 underline-offset-4 hover:underline" (click)="toggleMode()">
                Create one
              </button>
            </span>
          } @else {
            <span>
              Already have an account?
              <button type="button" class="ml-1 font-semibold text-slate-900 underline-offset-4 hover:underline" (click)="toggleMode()">
                Sign in
              </button>
            </span>
          }
        </div>
      </section>
    </main>
  `,
})
export class AuthPageComponent {
  readonly mode = signal<'login' | 'register'>('login');
  readonly isSubmitting: boolean;
  readonly authErrorMessage: string | null;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.isSubmitting = this.authService.isLoading();
    this.authErrorMessage = this.authService.authError()?.message ?? null;
  }

  toggleMode(): void {
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
  }

  handleLogin(data: LoginRequest): void {
    this.authService.login(data).subscribe({
      next: () => this.router.navigate(['/account']),
      error: () => undefined,
    });
  }

  handleRegister(data: RegisterRequest): void {
    this.authService.register(data).subscribe({
      next: () => this.router.navigate(['/account']),
      error: () => undefined,
    });
  }
}
