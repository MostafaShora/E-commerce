import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import type { LoginRequest, RegisterRequest } from '../../../core/auth/auth.models';
import { LoginFormComponent } from '../login-form/login-form';
import { RegisterFormComponent } from '../register-form/register-form';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, LoginFormComponent, RegisterFormComponent],
  templateUrl: './auth-page.html',
})
export class AuthPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly mode = signal<'login' | 'register'>('login');
  readonly isSubmitting = this.authService.isLoading;
  readonly authErrorMessage = computed(() => this.authService.authError()?.message ?? null);

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
