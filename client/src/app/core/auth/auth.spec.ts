import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call the login endpoint', () => {
    service.login({ email: 'user@example.com', password: 'secret123' }).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'User logged in successfully', user: { _id: '1', name: 'User', email: 'user@example.com', role: 'user' } });
    
    const cartRequest = httpMock.expectOne('/api/cart');
    expect(cartRequest.request.method).toBe('GET');
    cartRequest.flush({ message: 'Cart retrieved successfully', cart: { items: [] }, subtotal: 0, deliveryFee: 0, tax: 0, orderTotal: 0, freeDeliveryThreshold: 20 });
  });

  it('should call the register endpoint', () => {
    service.register({ name: 'User', email: 'user@example.com', password: 'secret123' }).subscribe();

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'User registered successfully', user: { _id: '2', name: 'User', email: 'user@example.com', role: 'user' } });
    
    const cartRequest = httpMock.expectOne('/api/cart');
    expect(cartRequest.request.method).toBe('GET');
    cartRequest.flush({ message: 'Cart retrieved successfully', cart: { items: [] }, subtotal: 0, deliveryFee: 0, tax: 0, orderTotal: 0, freeDeliveryThreshold: 20 });
  });

  it('should call the status endpoint', () => {
    service.loadCurrentUser().subscribe();

    const req = httpMock.expectOne('/api/auth/status');
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'User is authenticated', user: { _id: '3', name: 'Admin', email: 'admin@example.com', role: 'admin' } });
  });
});
