import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AdminService, type AdminCategory } from '../services/admin';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCheckboxModule],
  templateUrl: './categories.html',
})
export class AdminCategoriesComponent {
  readonly service = inject(AdminService);
  readonly categories = signal<AdminCategory[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly editing = signal<string | null>(null);
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.maxLength(500)],
    isActive: [true],
  });
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .getCategories()
      .subscribe({
        next: (r) => this.categories.set(r.categories),
        error: () => this.error.set('Unable to load categories.'),
        complete: () => this.loading.set(false),
      });
  }
  edit(category: AdminCategory): void {
    this.editing.set(category._id);
    this.form.patchValue({
      name: category.name,
      description: category.description ?? '',
      isActive: category.isActive,
    });
  }
  cancel(): void {
    this.editing.set(null);
    this.form.reset({ name: '', description: '', isActive: true });
  }
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const request = this.editing()
      ? this.service.updateCategory(this.editing()!, this.form.getRawValue())
      : null;
    request?.subscribe({
      next: () => {
        this.cancel();
        this.load();
      },
      error: () => undefined,
    });
  }
  toggle(category: AdminCategory): void {
    this.service
      .toggleCategory(category._id, !category.isActive)
      .subscribe({ next: () => this.load() });
  }
  remove(category: AdminCategory): void {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    this.service.deleteCategory(category._id).subscribe({ next: () => this.load() });
  }
}
