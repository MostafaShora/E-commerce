import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService, type CreateAdminProduct } from '../services/admin';
import { HomeService } from '../../home/services/home';
import type { CatalogCategory, CatalogProduct } from '../../../shared/models/catalog';

@Component({
  selector: 'app-admin-edit-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  templateUrl: './edit-product.html',
})
export class AdminEditProductComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly homeService = inject(HomeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly categories = signal<CatalogCategory[]>([]);
  readonly product = signal<CatalogProduct | null>(null);
  readonly selectedImage = signal<File | null>(null);
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
      error: () => this.errorMessage.set('Unable to load categories.'),
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
          if (foundProduct.images?.[0]) {
            this.imagePreview.set(foundProduct.images[0]);
          }
        } else {
          this.errorMessage.set('Product not found.');
        }
      },
      error: () => this.errorMessage.set('Unable to load product.'),
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
    const file = input.files?.[0] ?? null;
    this.selectedImage.set(file);
    this.imageError.set(null);
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

    this.adminService.updateProduct(this.productId, updateData).subscribe({
      next: () => void this.router.navigate(['/admin/products']),
      error: () => {
        this.errorMessage.set('Unable to update this product. Please try again.');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }
}
