import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  LucidePlus,
  LucideX,
  LucideSave,
  LucideImage,
  LucideFolderTree,
  LucidePencil,
  LucideEye,
  LucideEyeOff,
  LucideTrash2,
} from '@lucide/angular';

import { AdminService, type AdminCategory } from '../services/admin';
import { NotificationService } from '../../../core/services/notification';
import { normalizeApiError } from '../../../core/api/api-error';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    LucidePlus,
    LucideX,
    LucideSave,
    LucideImage,
    LucideFolderTree,
    LucidePencil,
    LucideEye,
    LucideEyeOff,
    LucideTrash2,
  ],
  templateUrl: './categories.html',
})
export class AdminCategoriesComponent {

  readonly service = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  readonly categories = signal<AdminCategory[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly editing = signal<string | null>(null);
  readonly saving = signal(false);
  readonly imageFile = signal<File | null>(null);
  readonly imagePreview = signal<string | null>(null);
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
    this.service.getCategories().subscribe({
      next: (r) => this.categories.set(r.categories),
      error: (error: unknown) => this.error.set(normalizeApiError(error).message),
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
    this.imageFile.set(null);
    this.imagePreview.set(category.image?.url ?? null);
  }
  cancel(): void {
    this.editing.set(null);
    this.form.reset({ name: '', description: '', isActive: true });
    this.revokePreview();
    this.imagePreview.set(null);
  }
  chooseImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      this.error.set('Only JPEG, PNG, and WebP images are allowed.');
    else if (file.size > 5 * 1024 * 1024) this.error.set('Category image must not exceed 5MB.');
    else {
      this.revokePreview();
      this.imageFile.set(file);
      this.imagePreview.set(URL.createObjectURL(file));
      this.error.set(null);
    }
    input.value = '';
  }
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.editing() || this.editing() === 'new') {
      if (!this.imageFile()) {
        this.error.set('Choose a category image before creating the category.');
        return;
      }
    }
    this.saving.set(true);
    const value = this.form.getRawValue();
    const request =
      this.editing() === 'new'
        ? this.service.createCategory(value, this.imageFile()!)
        : this.service.updateCategory(this.editing()!, value, this.imageFile() ?? undefined);
    request.subscribe({
      next: (response) => {
        this.notifications.success(response.message);
        this.cancel();
        this.load();
      },
      error: (error: unknown) => this.error.set(normalizeApiError(error).message),
      complete: () => this.saving.set(false),
    });
  }
  toggle(category: AdminCategory): void {
    this.service.toggleCategory(category._id, !category.isActive).subscribe({
      next: (response) => {
        this.notifications.success(response.message);
        this.load();
      },
      error: (error: unknown) => this.error.set(normalizeApiError(error).message),
    });
  }
  remove(category: AdminCategory): void {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    this.service.deleteCategory(category._id).subscribe({
      next: (response) => {
        this.notifications.success(response.message);
        this.load();
      },
      error: (error: unknown) => this.error.set(normalizeApiError(error).message),
    });
  }
  private revokePreview(): void {
    const preview = this.imagePreview();
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
  }
}
