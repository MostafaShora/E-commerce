import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService, type LoginRequest, type RegisterRequest } from '../../../core/auth/auth';
import { LoginFormComponent } from '../login-form/login-form';
import { RegisterFormComponent } from '../register-form/register-form';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, LoginFormComponent, RegisterFormComponent],
  template: `./auth-page.html`,
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
