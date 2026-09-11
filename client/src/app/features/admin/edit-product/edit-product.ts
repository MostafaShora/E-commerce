import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { normalizeApiError } from '../../../core/api/api-error';
import { NotificationService } from '../../../core/services/notification';
import { AdminService, type CreateAdminProduct } from '../services/admin';
import { HomeService } from '../../home/services/home';
import type { CatalogCategory, CatalogProduct } from '../../../shared/models/catalog';

@Component({
  selector: 'app-admin-edit-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCheckboxModule, MatIconModule],
  templateUrl: './edit-product.html',
})
export class AdminEditProductComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly homeService = inject(HomeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);

  readonly categories = signal<CatalogCategory[]>([]);
  readonly product = signal<CatalogProduct | null>(null);
  readonly selectedImages = signal<File[]>([]);
  readonly imageUrls = signal<string[]>([]);
  readonly imageUrlInput = signal('');
  readonly imagePreview = signal<string | null>(null);
  readonly loadingCategories = signal(true);
  readonly loadingProduct = signal(true);
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

  private productId: string | null = null;

  constructor() {
    this.homeService.getCategories().subscribe({
      next: (response) => this.categories.set(response.categories ?? []),
      error: (error: unknown) => this.errorMessage.set(normalizeApiError(error).message),
      complete: () => this.loadingCategories.set(false),
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.productId = id;
        this.loadProduct(id);
      }
    });
  }

  private loadProduct(productId: string): void {
    this.loadingProduct.set(true);
    this.adminService.getProducts(1, 100).subscribe({
      next: (response) => {
        const foundProduct = response.products.find((p) => p._id === productId);
        if (foundProduct) {
          this.product.set(foundProduct);
          this.populateForm(foundProduct);
          this.imageUrls.set(foundProduct.images ?? []);
          if (foundProduct.images?.[0]) this.imagePreview.set(foundProduct.images[0]);
        } else {
          this.errorMessage.set('Product not found.');
        }
      },
      error: (error: unknown) => this.errorMessage.set(normalizeApiError(error).message),
      complete: () => this.loadingProduct.set(false),
    });
  }

  private populateForm(product: CatalogProduct): void {
    const categoryId =
      typeof product.categoryId === 'object' && product.categoryId
        ? product.categoryId._id
        : ((product.categoryId as string) ?? '');
    this.form.patchValue({
      categoryId,
      name: product.name,
      description: product.description ?? '',
      originalPrice: product.originalPrice,
      discountPercent: product.discountPercent ?? 0,
      discountLabel: product.discountLabel ?? '',
      unit: product.unit ?? 'pc',
      stockCount: product.stockCount ?? 0,
      isActive: product.isActive ?? true,
    });
  }

  chooseImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    this.selectedImages.update((current) => [...current, ...files]);
    this.imageError.set(null);
    input.value = '';
  }

  addImageUrl(): void {
    const url = this.imageUrlInput().trim();
    try {
      if (!url) return;
      new URL(url);
      if (!this.imageUrls().includes(url)) this.imageUrls.update((images) => [...images, url]);
      this.imageUrlInput.set('');
    } catch {
      this.imageError.set('Enter a valid image URL.');
    }
  }

  removeImageUrl(url: string): void {
    this.imageUrls.update((images) => images.filter((image) => image !== url));
  }

  removeSelectedImage(index: number): void {
    this.selectedImages.update((images) => images.filter((_, imageIndex) => imageIndex !== index));
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

    if (!this.productId) {
      this.errorMessage.set('Product ID not found.');
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const updateData: Record<string, unknown> = {
      categoryId: value.categoryId,
      name: value.name,
      description: value.description || undefined,
      originalPrice: value.originalPrice,
      discountPercent: value.discountPercent,
      discountLabel: value.discountLabel || undefined,
      unit: value.unit,
      stockCount: value.stockCount,
      isActive: value.isActive,
    };

    const save = (uploadedImages: string[]) => this.adminService.updateProduct(this.productId!, { ...updateData, images: [...this.imageUrls(), ...uploadedImages] }).subscribe({
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
    const files = this.selectedImages();
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
