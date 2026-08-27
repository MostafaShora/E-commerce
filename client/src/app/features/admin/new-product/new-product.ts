import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService, type CreateAdminProduct } from '../services/admin';
import { HomeService } from '../../home/services/home';
import type { CatalogCategory } from '../../../shared/models/catalog';

@Component({
  selector: 'app-admin-new-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './new-product.html',
})
export class AdminNewProductComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly homeService = inject(HomeService);
  private readonly router = inject(Router);

  readonly categories = signal<CatalogCategory[]>([]);
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreview = signal<string | null>(null);
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
      error: () => this.errorMessage.set('Unable to load categories.'),
      complete: () => this.loadingCategories.set(false),
    });
  }

  chooseImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedImage.set(file);
    this.imageError.set(file ? null : 'A product image is required.');
    if (file) this.imagePreview.set(URL.createObjectURL(file));
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
      error: () => this.errorMessage.set('AI generation failed. Please try again.'),
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
    const image = this.selectedImage();
    if (!image) {
      this.imageError.set('A product image is required.');
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const request: CreateAdminProduct = {
      ...value,
      discountLabel: value.discountLabel || undefined,
      description: value.description || undefined,
    };
    this.adminService.createProduct(request, image).subscribe({
      next: () => void this.router.navigate(['/admin/products']),
      error: () => {
        this.errorMessage.set('Unable to create this product. Please try again.');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }
}
