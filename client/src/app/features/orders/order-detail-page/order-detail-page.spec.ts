import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';

import { OrderService, type CreatedOrder } from '../../checkout/services/order';
import { ReviewService } from '../../reviews/services/review';
import { OrderDetailPageComponent } from './order-detail-page';

describe('OrderDetailPageComponent', () => {
  let fixture: ComponentFixture<OrderDetailPageComponent>;
  let routeParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let orderService: { getOrderById: ReturnType<typeof vi.fn> };
  let currentStatus: CreatedOrder['status'];

  const baseOrder: CreatedOrder = {
    _id: 'order-1',
    orderNo: 'ORD-1',
    items: [],
    shippingAddress: {
      recipientName: 'Test User',
      phone: '555-0100',
      street: '1 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '10000',
      country: 'Test Country',
    },
    total: 10,
    subtotal: 10,
    deliveryFee: 0,
    tax: 0,
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'pending',
    status: 'placed',
    statusHistory: [{ status: 'placed', note: '', date: '2026-01-01T00:00:00.000Z' }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    currentStatus = 'placed';
    routeParams = new BehaviorSubject(convertToParamMap({ id: 'order-1' }));
    orderService = {
      getOrderById: vi.fn(() =>
        of({
          message: 'Order retrieved successfully',
          order: { ...baseOrder, status: currentStatus },
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [OrderDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParams.asObservable(),
            snapshot: { paramMap: convertToParamMap({ id: 'order-1' }) },
          },
        },
        { provide: OrderService, useValue: orderService },
        { provide: ReviewService, useValue: { getReviewableOrders: () => of({ orders: [] }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('refetches and replaces the order when the window regains focus', () => {
    currentStatus = 'assigned';

    window.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    expect(orderService.getOrderById).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.order()?.status).toBe('assigned');
    expect(fixture.componentInstance.currentTrackingIndex()).toBe(2);
    expect(fixture.componentInstance.trackingProgressPercent()).toBe(40);
    expect(fixture.nativeElement.querySelector('[aria-current="step"]')?.textContent).toContain(
      'Assigned',
    );
  });

  it('uses the six visible tracking statuses and safely handles cancelled and unknown states', () => {
    const component = fixture.componentInstance;

    expect(component.trackingSteps.map((step) => step.status)).toEqual([
      'placed',
      'confirmed',
      'assigned',
      'packed',
      'out_for_delivery',
      'delivered',
    ]);

    component.order.set({ ...baseOrder, status: 'out_for_delivery' });
    expect(component.currentTrackingIndex()).toBe(4);
    expect(component.trackingProgressPercent()).toBe(80);

    component.order.set({ ...baseOrder, status: 'delivered' });
    expect(component.currentTrackingIndex()).toBe(5);
    expect(component.trackingProgressPercent()).toBe(100);

    component.order.set({ ...baseOrder, status: 'cancelled' });
    expect(component.displayTrackingSteps().map((step) => step.status)).toEqual([
      'placed',
      'cancelled',
    ]);
    expect(component.currentTrackingIndex()).toBe(1);
    expect(component.trackingProgressPercent()).toBe(100);

    component.order.set({ ...baseOrder, status: 'unexpected' as CreatedOrder['status'] });
    expect(component.currentTrackingIndex()).toBe(0);
    expect(component.trackingProgressPercent()).toBe(0);
  });
});
