import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AddressService } from './address';

describe('AddressService', () => {
  let service: AddressService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [AddressService] });
    service = TestBed.inject(AddressService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads addresses from the authenticated endpoint', () => {
    service.loadAddresses().subscribe();
    const request = httpMock.expectOne('/api/address');
    expect(request.request.method).toBe('GET');
    request.flush({ message: 'Addresses retrieved successfully', addresses: [] });
    expect(service.addresses()).toEqual([]);
  });

  it('creates an address through the backend contract', () => {
    const input = { recipientName: 'Jane Doe', phone: '123', street: '1 Main', city: 'City', state: 'State', postalCode: '10000', country: 'Country' };
    service.createAddress(input).subscribe();
    const request = httpMock.expectOne('/api/address');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({ message: 'Address created successfully', address: { _id: '1', ...input, isDefault: true } });
    expect(service.addresses()[0].isDefault).toBe(true);
  });

  it('reports address API errors', () => {
    service.loadAddresses().subscribe({ error: () => undefined });
    httpMock.expectOne('/api/address').flush('failed', { status: 500, statusText: 'Server Error' });
    expect(service.errorMessage()).toBe('Unable to load your addresses right now.');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
