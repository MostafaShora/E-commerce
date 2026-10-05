import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideArrowLeft,
  LucideMinus,
  LucidePlus,
  LucideShoppingCart,
  LucideStar,
} from '@lucide/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import { CartService } from '../../../core/cart/cart';
import type { CatalogProduct } from '../../../shared/models/catalog';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { ProductRatingComponent } from '../../../shared/components/product-rating/product-rating';
import { ProductDetailService } from '../services/product-detail';
import {
  ReviewService,
  type ProductReview,
  type RatingBreakdownItem,
  type ReviewPagination,
} from '../../reviews/services/review';
import { getProductImageUrl, onImageError } from '../../../shared/utils/image.util';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    ProductCardComponent,
    ProductRatingComponent,
    LucideArrowLeft,
    LucideMinus,
    LucidePlus,
    LucideShoppingCart,
    LucideStar,
  ],
  templateUrl: './product-detail-page.html',
})
export class ProductDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productDetailService = inject(ProductDetailService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reviewService = inject(ReviewService);
  readonly cart = inject(CartService);

  readonly product = signal<CatalogProduct | null>(null);
  readonly relatedProducts = signal<CatalogProduct[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedImage = signal('');
  readonly quantity = signal(1);
  readonly reviews = signal<ProductReview[]>([]);
  readonly reviewsPagination = signal<ReviewPagination | null>(null);
  readonly ratingBreakdown = signal<RatingBreakdownItem[]>([]);
  readonly reviewsLoading = signal(false);
  readonly reviewsError = signal<string | null>(null);
  readonly onImageError = onImageError;

  constructor() {
    this.route.paramMap
      .pipe(
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
      )
      .subscribe((response) => {
        if (response) {
          this.product.set(response.product);
          this.relatedProducts.set(response.relatedProducts ?? []);
          this.selectedImage.set(getProductImageUrl(response.product.images));
          this.quantity.set(1);
          this.loadReviews(response.product.slug, 1);
        }
        this.loading.set(false);
      });
  }

  loadReviews(slug = this.product()?.slug ?? '', page = this.reviewsPagination()?.page ?? 1): void {
    if (!slug) return;
    this.reviewsLoading.set(true);
    this.reviewsError.set(null);
    this.reviewService
      .getProductReviews(slug, page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.reviews.set(response.reviews ?? []);
          this.reviewsPagination.set(response.pagination);
          this.ratingBreakdown.set(response.ratingBreakdown ?? []);
        },
        error: () => {
          this.reviews.set([]);
          this.reviewsPagination.set(null);
          this.ratingBreakdown.set([]);
          this.reviewsError.set('Reviews are available after signing in.');
        },
        complete: () => this.reviewsLoading.set(false),
      });
  }

  cartQuantity(product: CatalogProduct): number {
    return this.cart.items().find((item) => item.productId._id === product._id)?.quantity ?? 0;
  }

  addToCart(product: CatalogProduct): void {
    if (product.stockCount <= 0) {
      return;
    }

    this.cart.addProduct(product, this.quantity()).subscribe({
      next: () => this.quantity.set(1),
      error: () => undefined,
    });
  }

  decreaseQuantity(): void {
    this.quantity.set(Math.max(1, this.quantity() - 1));
  }

  increaseQuantity(product: CatalogProduct): void {
    this.quantity.set(Math.min(product.stockCount, this.quantity() + 1));
  }

  decreaseCartQuantity(product: CatalogProduct): void {
    const currentQuantity = this.cartQuantity(product);

    if (currentQuantity <= 1) {
      this.cart.removeProduct(product._id).subscribe();
      return;
    }

    this.cart.updateQuantity(product._id, currentQuantity - 1).subscribe();
  }

  increaseCartQuantity(product: CatalogProduct): void {
    const currentQuantity = this.cartQuantity(product);

    if (currentQuantity >= product.stockCount) {
      return;
    }

    this.cart.updateQuantity(product._id, currentQuantity + 1).subscribe();
  }

  reviewUserName(review: ProductReview): string {
    return typeof review.userId === 'object' ? review.userId.name : 'Verified customer';
  }

  reviewRating(review: ProductReview): number {
    return review.rating;
  }

  formatReviewDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  }

  selectImage(image: string): void {
    this.selectedImage.set(image);
  }

  retry(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loading.set(true);
      this.errorMessage.set(null);
      this.productDetailService
        .getProductBySlug(slug)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.product.set(response.product);
            this.relatedProducts.set(response.relatedProducts ?? []);
            this.selectedImage.set(response.product.images[0] ?? '');
            this.loadReviews(response.product.slug, 1);
          },
          error: () => this.errorMessage.set('Unable to load this product right now.'),
          complete: () => this.loading.set(false),
        });
    }
  }

  categoryName(product: CatalogProduct): string {
    return typeof product.categoryId === 'object' ? product.categoryId.name : '';
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

  ratingBreakdownTotal(): number {
    return this.ratingBreakdown().reduce((total, item) => total + item.count, 0) || 1;
  }

  ratingBreakdownEntry(rating: number): RatingBreakdownItem | undefined {
    return this.ratingBreakdown().find((entry) => entry.rating === rating);
  }

  ratingBreakdownPercent(rating: number): number {
    const item = this.ratingBreakdownEntry(rating);
    if (!item) {
      return 0;
    }

    return (item.count / this.ratingBreakdownTotal()) * 100;
  }

  goBack(): void {
    void this.router.navigate(['/products']);
  }
}
