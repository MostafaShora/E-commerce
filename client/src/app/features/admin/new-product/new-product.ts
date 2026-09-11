import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { normalizeApiError } from '../../../core/api/api-error';
import { NotificationService } from '../../../core/services/notification';
import { AdminService, type CreateAdminProduct } from '../services/admin';
import { HomeService } from '../../home/services/home';
import type { CatalogCategory } from '../../../shared/models/catalog';
import { prepareProductImages, type PendingProductImage } from '../models/admin.model';

@Component({
  selector: 'app-admin-new-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCheckboxModule, MatIconModule],
  templateUrl: './new-product.html',
})
export class AdminNewProductComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly homeService = inject(HomeService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly categories = signal<CatalogCategory[]>([]);
  readonly selectedImages = signal<PendingProductImage[]>([]);
  readonly imageUrls = signal<string[]>([]);
  readonly imageUrlInput = signal('');
  readonly loadingCategories = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);
  readonly aiAction = signal<'rephrase-title' | 'generate-desc' | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    categoryId: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    description: ['', Validators.maxLength(5000)],
    originalPrice: [0, [Validators.required, Validators.min(0)]],
    discountPercent: [0, [Validators.min(0), Validators.max(100)]],
    discountLabel: ['', Validators.maxLength(120)],
    unit: ['pc', [Validators.required, Validators.maxLength(60)]],
    stockCount: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
  });

  constructor() {
    this.homeService.getCategories().subscribe({
      next: (response) => this.categories.set(response.categories ?? []),
      error: (error: unknown) => this.errorMessage.set(normalizeApiError(error).message),
      complete: () => this.loadingCategories.set(false),
    });
  }

  chooseImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const result = prepareProductImages(Array.from(input.files ?? []));
    if (result.error) this.imageError.set(result.error);
    else if (result.images.length) {
      this.selectedImages.update((current) => [...current, ...result.images]);
      this.imageError.set(null);
    }
    input.value = '';
  }

  addImageUrl(): void {
    const url = this.imageUrlInput().trim();
    try {
      if (!url) return;
      new URL(url);
      if (!this.imageUrls().includes(url)) this.imageUrls.update((images) => [...images, url]);
      this.imageUrlInput.set('');
      this.imageError.set(null);
    } catch {
      this.imageError.set('Enter a valid image URL.');
    }
  }

  removeImageUrl(url: string): void {
    this.imageUrls.update((images) => images.filter((image) => image !== url));
  }

  removeSelectedImage(index: number): void {
    this.selectedImages.update((images) => {
      URL.revokeObjectURL(images[index].preview);
      return images.filter((_, imageIndex) => imageIndex !== index);
    });
  }

  salePrice(): number {
    const value = this.form.getRawValue();
    return Math.round(value.originalPrice * (1 - value.discountPercent / 100) * 100) / 100;
  }

  generateTitle(): void {
    const value = this.form.getRawValue();
    if (!value.name.trim()) return;
    this.runAi({ action: 'rephrase-title', title: value.name, unit: value.unit });
  }

  generateDescription(): void {
    const value = this.form.getRawValue();
    if (!value.name.trim()) return;
    this.runAi({
      action: 'generate-desc',
      title: value.name,
      unit: value.unit,
      description: value.description,
    });
  }

  private runAi(request: Parameters<AdminService['generateAi']>[0]): void {
    this.aiAction.set(request.action);
    this.adminService.generateAi(request).subscribe({
      next: (response) => {
        if (request.action === 'rephrase-title') {
          this.form.controls.name.setValue(response.result);
        } else {
          this.form.controls.description.setValue(response.result);
        }
      },
      error: (error: unknown) => this.errorMessage.set(normalizeApiError(error).message),
      complete: () => this.aiAction.set(null),
    });
  }

  submit(): void {
    this.errorMessage.set(null);
    this.imageError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.selectedImages().length && !this.imageUrls().length) {
      this.imageError.set('Add at least one product image or image URL.');
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const request: CreateAdminProduct = {
      ...value,
      discountLabel: value.discountLabel || undefined,
      description: value.description || undefined,
    };
    const save = (uploadedImages: string[]) => this.adminService.createProduct({ ...request, images: [...this.imageUrls(), ...uploadedImages] }).subscribe({
      next: (response) => {
        this.notifications.success(response.message);
        void this.router.navigate(['/admin/products']);
      },
      error: (error: unknown) => {
        this.errorMessage.set(normalizeApiError(error).message);
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
    const files = this.selectedImages().map((image) => image.file);
    if (files.length) {
      this.adminService.uploadProductImages(files).subscribe({
        next: (response) => save(response.images),
        error: (error: unknown) => { this.errorMessage.set(normalizeApiError(error).message); this.saving.set(false); },
      });
    } else {
      save([]);
    }
  }
}
