import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import type { LoginRequest } from '../../core/auth/auth';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate>
      <div>
        <label for="login-email" class="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          id="login-email"
          type="email"
          formControlName="email"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="you@example.com"
          [class.border-red-500]="
            emailControl.invalid && (emailControl.touched || emailControl.dirty)
          "
        />
        @if (emailControl.invalid && (emailControl.touched || emailControl.dirty)) {
          <div class="mt-1 text-xs text-red-600">Please enter a valid email.</div>
        }
      </div>

      <div>
        <label for="login-password" class="mb-1 block text-sm font-medium text-slate-700"
          >Password</label
        >
        <input
          id="login-password"
          type="password"
          formControlName="password"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="••••••••"
          [class.border-red-500]="
            passwordControl.invalid && (passwordControl.touched || passwordControl.dirty)
          "
        />
        @if (passwordControl.invalid && (passwordControl.touched || passwordControl.dirty)) {
          <div class="mt-1 text-xs text-red-600">Password is required.</div>
        }
      </div>

      <button
        type="submit"
        [disabled]="form.invalid || isSubmitting"
        class="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        @if (isSubmitting) {
          <span>Signing in...</span>
        } @else {
          <span>Login</span>
        }
      </button>
    </form>
  `,
})
export class LoginFormComponent {
  @Input() isSubmitting = false;
  @Input() serverError: string | null = null;
  @Output() submitted = new EventEmitter<LoginRequest>();

  readonly form: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  get emailControl(): FormControl<string> {
    return this.form.controls['email'];
  }

  get passwordControl(): FormControl<string> {
    return this.form.controls['password'];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.form.getRawValue() as LoginRequest);
  }
}
