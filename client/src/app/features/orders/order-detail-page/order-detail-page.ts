import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideArrowLeft,
  LucideCalendar,
  LucideCircleCheck,
  LucideCircleX,
  LucideCreditCard,
  LucideHouse,
  LucideMapPin,
  LucidePackageCheck,
  LucideShoppingBag,
  LucideShoppingCart,
  LucideStar,
  LucideTruck,
} from '@lucide/angular';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, map, merge, of, Subject, switchMap } from 'rxjs';

import {
  OrderService,
  type CreatedOrder,
  type OrderStatus,
  type PaymentStatus,
} from '../../checkout/services/order';
import { ReviewService, type ReviewableOrderItem } from '../../reviews/services/review';
import { LanguageService } from '../../../core/services/language';
import { getProductImageUrl, onImageError } from '../../../shared/utils/image.util';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideArrowLeft,
    LucideCalendar,
    LucideCircleCheck,
    LucideCircleX,
    LucideCreditCard,
    LucideHouse,
    LucideMapPin,
    LucidePackageCheck,
    LucideShoppingBag,
    LucideShoppingCart,
    LucideStar,
    LucideTruck,
  ],
  templateUrl: './order-detail-page.html',
})
export class OrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reviewService = inject(ReviewService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly refreshOrder$ = new Subject<string | null>();
  readonly language = inject(LanguageService);

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
  readonly getProductImageUrl = getProductImageUrl;
  readonly onImageError = onImageError;
  readonly reviewForm = this.formBuilder.nonNullable.group({
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(1000)]],
  });
  readonly cancelForm = this.formBuilder.nonNullable.group({
    reason: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    merge(this.route.paramMap.pipe(map((params) => params.get('id'))), this.refreshOrder$)
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          this.errorMessage.set(null);
          if (!id) {
            this.order.set(null);
            this.loading.set(false);
            return of(null);
          }

          return this.orderService.getOrderById(id).pipe(
            catchError(() => {
              this.errorMessage.set(this.language.t('orders.unableToFind'));
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.order.set(response?.order ?? null);
          if (response?.order) this.loadReviewableItems(response.order._id);
        },
      });
  }

  @HostListener('window:focus')
  refreshOnWindowFocus(): void {
    this.refreshOrder$.next(this.route.snapshot.paramMap.get('id'));
  }

  loadOrder(): void {
    this.refreshOrder$.next(this.route.snapshot.paramMap.get('id'));
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
              : message || this.language.t('orders.cancelError'),
          );
        },
      });
  }

  readonly trackingSteps: Array<{ status: OrderStatus; label: string }> = [
    { status: 'placed', label: 'Placed' },
    { status: 'confirmed', label: 'Confirmed' },
    { status: 'packed', label: 'Packed' },
    { status: 'out_for_delivery', label: 'Out for Delivery' },
    { status: 'delivered', label: 'Delivered' },
  ];

  readonly currentTrackingIndex = computed(() => {
    const status = this.order()?.status ?? 'placed';
    const index = this.displayTrackingSteps().findIndex((step) => step.status === status);
    return index < 0 ? 0 : index;
  });

  readonly trackingProgressPercent = computed(() => {
    const steps = this.displayTrackingSteps();
    return steps.length > 1 ? (this.currentTrackingIndex() / (steps.length - 1)) * 100 : 0;
  });

  displayTrackingSteps(): Array<{ status: OrderStatus; label: string }> {
    const steps: Array<{ status: OrderStatus; label: string }> =
      this.order()?.status === 'cancelled'
        ? [
            { status: 'placed', label: 'Placed' },
            { status: 'cancelled', label: 'Cancelled' },
          ]
        : this.trackingSteps;
    return steps.map((step) => ({ ...step, label: this.statusLabel(step.status) }));
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
        error: () => this.reviewError.set(this.language.t('orders.reviewSubmitError')),
        complete: () => this.reviewSubmitting.set(false),
      });
  }

  statusLabel(status: OrderStatus): string {
    const key = status
      .toLowerCase()
      .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const path = `orders.status.${key}`;
    const translated = this.language.t(path);
    return translated === path
      ? status.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
      : translated;
  }

  orderStatusClass(status: OrderStatus): string {
    return `status-${status.replaceAll('_', '-')}`;
  }

  paymentLabel(value: PaymentStatus | string): string {
    const key = value
      .toLowerCase()
      .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const path = `orders.paymentStatuses.${key}`;
    const translated = this.language.t(path);
    return translated === path ? value.replaceAll('_', ' ') : translated;
  }

  paymentMethodLabel(value: string | undefined): string {
    if (!value) return this.language.t('orders.card');
    const key = value.toLowerCase() === 'cash_on_delivery' ? 'cashOnDelivery' : value.toLowerCase();
    const path = `orders.paymentMethods.${key}`;
    const translated = this.language.t(path);
    return translated === path ? value.replaceAll('_', ' ') : translated;
  }

  paymentStatusClass(status: PaymentStatus): string {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'failed':
        return 'status-failed';
      case 'refunded':
        return 'status-inactive';
      case 'pending':
      default:
        return 'status-payment-pending';
    }
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.language.language() === 'ar' ? 'ar' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
