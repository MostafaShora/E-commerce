import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, map, of, switchMap } from 'rxjs';

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
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
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
  readonly cancelling = signal(false);
  readonly showCancelConfirmation = signal(false);
  readonly cancelError = signal<string | null>(null);
  readonly cancellationMessage = signal<string | null>(null);
  readonly reviewForm = this.formBuilder.nonNullable.group({
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(1000)]],
  });
  readonly cancelForm = this.formBuilder.nonNullable.group({
    reason: ['', [Validators.maxLength(500)]],
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

  canCancel(): boolean {
    return this.order()?.status === 'placed';
  }

  requestCancellation(): void {
    this.cancelError.set(null);
    this.cancellationMessage.set(null);
    this.cancelForm.reset({ reason: '' });
    this.showCancelConfirmation.set(true);
  }

  dismissCancellation(): void {
    if (!this.cancelling()) {
      this.cancelForm.reset({ reason: '' });
      this.showCancelConfirmation.set(false);
    }
  }

  cancelOrder(): void {
    const order = this.order();
    if (!order || this.cancelling()) return;

    this.cancelling.set(true);
    this.cancelError.set(null);
    const reason = this.cancelForm.controls.reason.value?.trim();

    this.orderService
      .cancelOrder(order._id, reason ? { reason } : {})
      .pipe(
        finalize(() => this.cancelling.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.showCancelConfirmation.set(false);
          this.cancelForm.reset({ reason: '' });
          this.cancellationMessage.set(
            response.refunded && response.refundId
              ? `${response.message} Refund confirmation: ${response.refundId}.`
              : response.message,
          );
          this.loadOrder();
        },
        error: (error: { error?: { message?: string | string[] } }) => {
          const message = error.error?.message;
          this.cancelError.set(
            Array.isArray(message)
              ? message.join(', ')
              : message || 'Unable to cancel this order. Please try again.',
          );
        },
      });
  }

  readonly trackingSteps: Array<{ status: OrderStatus; label: string }> = [
    { status: 'placed', label: 'Placed' },
    { status: 'confirmed', label: 'Confirmed' },
    { status: 'assigned', label: 'Assigned' },
    { status: 'packed', label: 'Packed' },
    { status: 'out_for_delivery', label: 'Out for delivery' },
    { status: 'delivered', label: 'Delivered' },
  ];

  displayTrackingSteps(): Array<{ status: OrderStatus; label: string }> {
    return this.order()?.status === 'cancelled'
      ? [
          { status: 'placed', label: 'Placed' },
          { status: 'cancelled', label: 'Cancelled' },
        ]
      : this.trackingSteps;
  }

  trackingIndex(status: OrderStatus): number {
    return this.displayTrackingSteps().findIndex((step) => step.status === status);
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
    return status.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
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
