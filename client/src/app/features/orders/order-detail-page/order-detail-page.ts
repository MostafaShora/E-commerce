import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, of, switchMap } from 'rxjs';

import {
  OrderService,
  type CreatedOrder,
  type OrderStatus,
  type PaymentStatus,
} from '../../checkout/services/order';
import { ReviewService, type ReviewableOrderItem } from '../../reviews/services/review';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './order-detail-page.html',
})
export class OrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reviewService = inject(ReviewService);
  private readonly formBuilder = inject(FormBuilder);

  readonly order = signal<CreatedOrder | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly reviewableItems = signal<ReviewableOrderItem[]>([]);
  readonly activeReviewItem = signal<ReviewableOrderItem | null>(null);
  readonly reviewSubmitting = signal(false);
  readonly reviewMessage = signal<string | null>(null);
  readonly reviewError = signal<string | null>(null);
  readonly reviewForm = this.formBuilder.nonNullable.group({
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(1000)]],
  });

  constructor() {
    this.loadOrder();
  }

  loadOrder(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        switchMap((id) => (id ? this.orderService.getOrderById(id) : of(null))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.order.set(response?.order ?? null);
          if (response?.order) this.loadReviewableItems(response.order._id);
        },
        error: () => this.errorMessage.set('Unable to find this order.'),
        complete: () => this.loading.set(false),
      });
  }

  private loadReviewableItems(orderId: string): void {
    this.reviewService
      .getReviewableOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const order = response.orders.find((item) => item._id === orderId);
          this.reviewableItems.set(order?.items.filter((item) => !item.isReviewed) ?? []);
        },
        error: () => this.reviewableItems.set([]),
      });
  }

  canReview(itemId: string): boolean {
    return this.reviewableItems().some((item) => item._id === itemId);
  }

  startReview(item: ReviewableOrderItem): void {
    this.activeReviewItem.set(item);
    this.reviewMessage.set(null);
    this.reviewError.set(null);
    this.reviewForm.reset({ rating: 0, comment: '' });
  }

  startReviewById(itemId: string | undefined): void {
    const item = itemId
      ? this.reviewableItems().find((candidate) => candidate._id === itemId)
      : undefined;
    if (item) this.startReview(item);
  }

  cancelReview(): void {
    this.activeReviewItem.set(null);
    this.reviewForm.reset({ rating: 0, comment: '' });
  }

  setRating(rating: number): void {
    this.reviewForm.controls.rating.setValue(rating);
    this.reviewForm.controls.rating.markAsTouched();
  }

  submitReview(): void {
    const order = this.order();
    const item = this.activeReviewItem();
    if (!order || !item || this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.reviewSubmitting.set(true);
    this.reviewError.set(null);
    this.reviewMessage.set(null);
    this.reviewService
      .createReview({
        orderId: order._id,
        orderItemId: item._id,
        rating: this.reviewForm.controls.rating.value,
        comment: this.reviewForm.controls.comment.value || undefined,
      })
      .subscribe({
        next: (response) => {
          this.reviewMessage.set(response.message);
          this.activeReviewItem.set(null);
          this.loadReviewableItems(order._id);
          this.loadOrder();
        },
        error: () => this.reviewError.set('Unable to submit this review. Please try again.'),
        complete: () => this.reviewSubmitting.set(false),
      });
  }

  statusLabel(status: OrderStatus): string {
    return status.replaceAll('_', ' ');
  }

  paymentLabel(value: PaymentStatus | string): string {
    return value.replaceAll('_', ' ');
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
