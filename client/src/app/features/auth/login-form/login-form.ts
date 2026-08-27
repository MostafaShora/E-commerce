import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import type { LoginRequest } from '../../../core/auth/auth.models';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-form.html',
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
