import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import type { CatalogProduct } from '../../../shared/models/catalog';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { ProductDetailService } from '../services/product-detail';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './product-detail-page.html',
})
export class ProductDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productDetailService = inject(ProductDetailService);
  private readonly destroyRef = inject(DestroyRef);

  readonly product = signal<CatalogProduct | null>(null);
  readonly relatedProducts = signal<CatalogProduct[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedImage = signal('');

  constructor() {
    this.route.paramMap.pipe(
      map((params) => params.get('slug')),
      distinctUntilChanged(),
      switchMap((slug) => {
        if (!slug) {
          return of(null);
        }

        this.loading.set(true);
        this.errorMessage.set(null);
        return this.productDetailService.getProductBySlug(slug).pipe(
          catchError(() => {
            this.product.set(null);
            this.relatedProducts.set([]);
            this.errorMessage.set('Unable to load this product right now.');
            return of(null);
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((response) => {
      if (response) {
        this.product.set(response.product);
        this.relatedProducts.set(response.relatedProducts ?? []);
        this.selectedImage.set(response.product.images[0] ?? '');
      }
      this.loading.set(false);
    });
  }

  selectImage(image: string): void {
    this.selectedImage.set(image);
  }

  retry(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loading.set(true);
      this.errorMessage.set(null);
      this.productDetailService.getProductBySlug(slug).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: (response) => {
          this.product.set(response.product);
          this.relatedProducts.set(response.relatedProducts ?? []);
          this.selectedImage.set(response.product.images[0] ?? '');
        },
        error: () => this.errorMessage.set('Unable to load this product right now.'),
        complete: () => this.loading.set(false),
      });
    }
  }

  categoryName(product: CatalogProduct): string {
    return typeof product.categoryId === 'object' ? product.categoryId.name : '';
  }

  roundedRating(product: CatalogProduct): number {
    return Math.round(product.ratingAverage);
  }

  hasDiscount(product: CatalogProduct): boolean {
    return product.originalPrice > product.salePrice;
  }

  stockTone(product: CatalogProduct): string {
    if (product.stockCount <= 0) return 'text-red-600';
    if (product.stockCount <= 5) return 'text-amber-600';
    return 'text-emerald-600';
  }

  stockText(product: CatalogProduct): string {
    if (product.stockCount <= 0) return 'Out of stock';
    if (product.stockCount <= 5) return `Only ${product.stockCount} left`;
    return 'In stock';
  }

  goBack(): void {
    void this.router.navigate(['/products']);
  }
}
