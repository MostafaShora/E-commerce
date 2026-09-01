import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../core/auth/auth.service';
import { AuthState } from '../../../core/auth/auth.state';
import { NotificationService } from '../../../core/services/notification';
import { LoginFormComponent } from '../../../features/auth/login-form/login-form';
import { RegisterFormComponent } from '../../../features/auth/register-form/register-form';
import type { LoginRequest, RegisterRequest } from '../../../core/auth/auth.models';

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [LoginFormComponent, RegisterFormComponent, MatIconModule],
  templateUrl: './auth-dialog.html',
})
export class AuthDialogComponent {
  readonly authState = inject(AuthState);
  readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  readonly errorMessage = computed(() => this.auth.authError()?.message ?? null);

  login(data: LoginRequest): void {
    this.auth.login(data).subscribe({
      next: () => {
        this.authState.closeAuth();
        this.notifications.success('Successfully logged in.');
      },
    });
  }

  register(data: RegisterRequest): void {
    this.auth.register(data).subscribe({
      next: () => {
        this.authState.closeAuth();
        this.notifications.success('Successfully registered.');
      },
    });
  }
}
