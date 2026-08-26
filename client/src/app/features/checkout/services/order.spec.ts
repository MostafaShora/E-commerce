import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OrderService } from './order';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderService],
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests the authenticated user order list', () => {
    service.getOrders().subscribe();
    const request = httpMock.expectOne('/api/order');
    expect(request.request.method).toBe('GET');
    request.flush({ message: 'Orders retrieved successfully', orders: [] });
  });

  it('requests a customer order by its id', () => {
    service.getOrderById('order/123').subscribe();
    const request = httpMock.expectOne('/api/order/order%2F123');
    expect(request.request.method).toBe('GET');
    request.flush({ message: 'Order retrieved successfully', order: { _id: '123' } });
  });
});
