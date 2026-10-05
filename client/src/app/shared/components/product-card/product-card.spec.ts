import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { CartService, type CartResponse } from '../../../core/cart/cart';
import type { CatalogProduct } from '../../models/catalog';
import { ProductCardComponent } from './product-card';

describe('ProductCardComponent', () => {
  let firstFixture: ComponentFixture<ProductCardComponent>;
  let secondFixture: ComponentFixture<ProductCardComponent>;
  let pendingCartUpdate: Subject<CartResponse>;
  let addProduct: ReturnType<typeof vi.fn>;

  const product = (id: string): CatalogProduct => ({
    _id: id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    images: [],
    originalPrice: 10,
    salePrice: 10,
    discountPercent: 0,
    unit: 'pc',
    stockCount: 5,
    ratingAverage: 0,
    reviewCount: 0,
  });

  beforeEach(async () => {
    pendingCartUpdate = new Subject<CartResponse>();
    addProduct = vi.fn(() => pendingCartUpdate.asObservable());

    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: { addProduct } },
      ],
    }).compileComponents();

    firstFixture = TestBed.createComponent(ProductCardComponent);
    firstFixture.componentRef.setInput('product', product('one'));
    firstFixture.detectChanges();

    secondFixture = TestBed.createComponent(ProductCardComponent);
    secondFixture.componentRef.setInput('product', product('two'));
    secondFixture.detectChanges();
  });

  afterEach(() => pendingCartUpdate.complete());

  it('shows loading only on the card whose add-to-cart request is pending', () => {
    const firstButton = firstFixture.nativeElement.querySelector(
      'app-button button',
    ) as HTMLButtonElement;
    const secondButton = secondFixture.nativeElement.querySelector(
      'app-button button',
    ) as HTMLButtonElement;

    firstButton.click();
    firstFixture.detectChanges();
    secondFixture.detectChanges();

    expect(addProduct).toHaveBeenCalledTimes(1);
    expect(firstButton.disabled).toBe(true);
    expect(firstButton.textContent).toContain('...');
    expect(secondButton.disabled).toBe(false);
    expect(secondButton.textContent).not.toContain('...');
  });
});