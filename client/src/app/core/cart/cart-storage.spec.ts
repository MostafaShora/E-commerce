import { TestBed } from '@angular/core/testing';

import { CartStorage } from './cart-storage';

describe('CartStorage', () => {
  let service: CartStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
