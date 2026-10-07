import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ReviewService } from '../services/review';
import { AccountReviewsPageComponent } from './account-reviews';

describe('AccountReviewsPageComponent', () => {
  let fixture: ComponentFixture<AccountReviewsPageComponent>;
  let reviewService: {
    getReviewableOrders: ReturnType<typeof vi.fn>;
    getUserReviews: ReturnType<typeof vi.fn>;
    createReview: ReturnType<typeof vi.fn>;
  };
  let reviewable: boolean;

  const order = {
    _id: 'order-1',
    orderNo: 'ORD-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    items: [
      {
        _id: 'item-1',
        productId: 'product-1',
        name: 'Test Product',
        image: '/test-product.png',
        originalPrice: 10,
        salePrice: 8,
        quantity: 1,
        isReviewed: false,
      },
    ],
  };

  const submittedReview = {
    _id: 'review-1',
    userId: 'user-1',
    orderId: order._id,
    orderItemId: 'item-1',
    productId: {
      _id: 'product-1',
      name: 'Test Product',
      slug: 'test-product',
      images: ['/test-product.png'],
    },
    rating: 5,
    comment: 'Fresh and delicious',
    createdAt: '2026-01-02T00:00:00.000Z',
  };

  beforeEach(async () => {
    reviewable = true;
    reviewService = {
      getReviewableOrders: vi.fn(() =>
        of({
          message: 'Reviewable order items retrieved successfully',
          orders: reviewable ? [order] : [],
        }),
      ),
      getUserReviews: vi.fn(() =>
        of({
          message: 'Reviews retrieved successfully',
          reviews: reviewable ? [] : [submittedReview],
        }),
      ),
      createReview: vi.fn(() => {
        reviewable = false;
        return of({ message: 'Review created successfully', review: submittedReview });
      }),
    };

    await TestBed.configureTestingModule({
      imports: [AccountReviewsPageComponent],
      providers: [provideRouter([]), { provide: ReviewService, useValue: reviewService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountReviewsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  const pageText = () =>
    fixture.nativeElement.textContent.replaceAll('\u2068', '').replaceAll('\u2069', '');

  it('maps reviewable order items to review forms', () => {
    expect(fixture.componentInstance.reviewableEntries()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Test Product');
    expect(pageText()).toContain('To review (1)');
  });

  it('keeps a submitted review visible when its product has been deleted', () => {
    const component = fixture.componentInstance;
    component.submittedReviews.set([{ ...submittedReview, productId: null }]);
    component.activeTab.set('reviewed');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unavailable product');
    expect(fixture.nativeElement.textContent).toContain('Fresh and delicious');
    expect(fixture.nativeElement.querySelector('img[src="/placeholder.png"]')).toBeNull();
  });

  it('submits rating and comment, then moves the item to Reviewed', () => {
    const component = fixture.componentInstance;
    const entry = component.reviewableEntries()[0];
    component.setRating(entry, 5);
    component.formFor(entry).controls.comment.setValue('Fresh and delicious');

    component.submit(entry);
    fixture.detectChanges();

    expect(reviewService.createReview).toHaveBeenCalledWith({
      orderId: 'order-1',
      orderItemId: 'item-1',
      rating: 5,
      comment: 'Fresh and delicious',
    });
    expect(component.reviewableEntries()).toHaveLength(0);
    expect(component.submittedReviews()).toHaveLength(1);

    const reviewedTab = fixture.nativeElement.querySelector('[role="tablist"] button:last-child');
    reviewedTab.click();
    fixture.detectChanges();
    expect(pageText()).toContain('Reviewed (1)');
    expect(fixture.nativeElement.textContent).toContain('Fresh and delicious');
  });

  it('allows an empty comment and clears pending state after a submission error', () => {
    const component = fixture.componentInstance;
    const entry = component.reviewableEntries()[0];
    component.setRating(entry, 4);
    component.formFor(entry).controls.comment.setValue('');
    reviewService.createReview.mockReturnValueOnce(throwError(() => new Error('request failed')));

    component.submit(entry);
    fixture.detectChanges();

    expect(reviewService.createReview).toHaveBeenCalledWith({
      orderId: 'order-1',
      orderItemId: 'item-1',
      rating: 4,
      comment: undefined,
    });
    expect(component.isSubmitting(entry)).toBe(false);
    expect(component.errorMessage()).toBe('Unable to submit this review. Please try again.');
  });
});
