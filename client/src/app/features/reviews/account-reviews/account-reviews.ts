import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, forkJoin, of } from 'rxjs';
import {
  ReviewService,
  type ProductReview,
  type ReviewProduct,
  type ReviewableOrderItem,
} from '../services/review';
import { RouterLink } from '@angular/router';

type ReviewEntry = {
  item: ReviewableOrderItem;
  orderId: string;
  orderNo: string;
  orderDate: string;
};

type ReviewForm = FormGroup<{
  rating: FormControl<number>;
  comment: FormControl<string>;
}>;

@Component({
  selector: 'app-account-reviews-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  templateUrl: './account-reviews.html',
})
export class AccountReviewsPageComponent {
  private readonly reviewService = inject(ReviewService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly reviewableEntries = signal<ReviewEntry[]>([]);
  readonly submittedReviews = signal<ProductReview[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly activeTab = signal<'to-review' | 'reviewed'>('to-review');
  readonly submittingKey = signal<string | null>(null);
  readonly reviewForms = new Map<string, ReviewForm>();

  constructor() {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      reviewable: this.reviewService.getReviewableOrders().pipe(catchError(() => of(null))),
      submitted: this.reviewService.getUserReviews().pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ reviewable, submitted }) => {
        if (!reviewable || !submitted) {
          this.errorMessage.set('Unable to load your reviews right now.');
        }

        this.reviewableEntries.set(
          (reviewable?.orders ?? []).flatMap((order) =>
            order.items
              .filter((item) => !item.isReviewed)
              .map((item) => ({
                item,
                orderId: order._id,
                orderNo: order.orderNo,
                orderDate: order.createdAt,
              })),
          ),
        );
        this.submittedReviews.set(submitted?.reviews ?? []);
        this.loading.set(false);
      });
  }

  formFor(entry: ReviewEntry): ReviewForm {
    const existingForm = this.reviewForms.get(this.reviewKey(entry));
    if (existingForm) return existingForm;

    const form = this.formBuilder.nonNullable.group({
        rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
        comment: ['', Validators.maxLength(1000)],
    });
    this.reviewForms.set(this.reviewKey(entry), form);
    return form;
  }

  submit(entry: ReviewEntry): void {
    const form = this.formFor(entry);
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const key = this.reviewKey(entry);
    this.submittingKey.set(key);
    this.reviewService
      .createReview({
        orderId: entry.orderId,
        orderItemId: entry.item._id,
        rating: form.controls.rating.value,
        comment: form.controls.comment.value || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadReviews();
        },
        error: () => this.errorMessage.set('Unable to submit this review. Please try again.'),
        complete: () => this.submittingKey.set(null),
      });
  }

  setRating(entry: ReviewEntry, rating: number): void {
    const control = this.formFor(entry).controls.rating;
    control.setValue(rating);
    control.markAsTouched();
  }

  isSubmitting(entry: ReviewEntry): boolean {
    return this.submittingKey() === this.reviewKey(entry);
  }

  reviewKey(entry: ReviewEntry): string {
    return `${entry.orderId}-${entry.item._id}`;
  }

  submittedProduct(review: ProductReview): ReviewProduct | null {
    return typeof review.productId === 'object' ? review.productId : null;
  }

  productImage(product: ReviewProduct | null): string {
    const image = product?.images?.[0];
    return typeof image === 'string' ? image : image?.url ?? '/placeholder.png';
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  }
}
