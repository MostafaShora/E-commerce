import { TestBed } from '@angular/core/testing';

import { CartService, type CartResponse } from './cart';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;

  const response: CartResponse = {
    message: 'Cart retrieved successfully',
    cart: {
      items: [{
        productId: {
          _id: 'product-1', name: 'Apples', slug: 'apples', images: ['apples.png'],
          salePrice: 2, originalPrice: 2.5, discountPercent: 20, stockCount: 5,
        },
        quantity: 2,
      }],
    },
    subtotal: 4,
    deliveryFee: 4.99,
    tax: 0.32,
    orderTotal: 9.31,
    freeDeliveryThreshold: 20,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CartService],
    });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads the authoritative cart and totals', () => {
    service.loadCart().subscribe();
    const request = httpMock.expectOne('/api/cart');
    expect(request.request.method).toBe('GET');
    request.flush(response);
    expect(service.items().length).toBe(1);
    expect(service.subtotal()).toBe(4);
    expect(service.orderTotal()).toBe(9.31);
  });

  it('updates and removes through full cart POST payloads', () => {
    service.loadCart().subscribe();
    httpMock.expectOne('/api/cart').flush(response);

    service.updateQuantity('product-1', 3).subscribe();
    const updateRequest = httpMock.expectOne('/api/cart');
    expect(updateRequest.request.method).toBe('POST');
    expect(updateRequest.request.body).toEqual({ items: [{ productId: 'product-1', quantity: 3 }] });
    updateRequest.flush({ ...response, cart: { items: [{ ...response.cart.items[0], quantity: 3 }] } });

    service.removeProduct('product-1').subscribe();
    const removeRequest = httpMock.expectOne('/api/cart');
    expect(removeRequest.request.body).toEqual({ items: [] });
    removeRequest.flush({ ...response, cart: { items: [] }, subtotal: 0, deliveryFee: 0, tax: 0, orderTotal: 0 });
    expect(service.items()).toEqual([]);
  });

  it('exposes an API error without inventing local totals', () => {
    service.loadCart().subscribe({ error: () => undefined });
    httpMock.expectOne('/api/cart').flush('failed', { status: 500, statusText: 'Server Error' });
    expect(service.errorMessage()).toBe('Unable to load your cart right now.');
    expect(service.subtotal()).toBe(0);
  });
});
