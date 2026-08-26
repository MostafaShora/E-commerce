import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AdminService } from './admin';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests admin products with pagination', () => {
    service.getProducts(2, 20).subscribe();
    const request = httpMock.expectOne('/api/product/admin?page=2&limit=20');
    expect(request.request.method).toBe('GET');
    request.flush({
      message: 'ok',
      products: [],
      pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it('updates order status using the controlled backend endpoint', () => {
    service.updateOrderStatus('order-1', 'confirmed').subscribe();
    const request = httpMock.expectOne('/api/order/admin/order-1/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'confirmed', note: undefined });
    request.flush({ message: 'updated', order: {} });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
