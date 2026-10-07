import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, type WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CartService, type CartItem, type CartResponse } from '../../../core/cart/cart';
import { LanguageService } from '../../../core/services/language';
import { CartPageComponent } from './cart-page';

describe('CartPageComponent', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let cart: {
    items: WritableSignal<CartItem[]>;
    subtotal: WritableSignal<number>;
    deliveryFee: WritableSignal<number>;
    tax: WritableSignal<number>;
    orderTotal: WritableSignal<number>;
    freeDeliveryThreshold: WritableSignal<number>;
    loading: WritableSignal<boolean>;
    saving: WritableSignal<boolean>;
    errorMessage: WritableSignal<string | null>;
    itemCount: WritableSignal<number>;
    loadCart: ReturnType<typeof vi.fn>;
    updateQuantity: ReturnType<typeof vi.fn>;
    removeProduct: ReturnType<typeof vi.fn>;
    clearCart: ReturnType<typeof vi.fn>;
    retry: ReturnType<typeof vi.fn>;
  };

  const product: CartItem['productId'] = {
    _id: 'product-1',
    name: 'Apples',
    slug: 'apples',
    images: [],
    originalPrice: 4,
    salePrice: 3,
    discountPercent: 25,
    stockCount: 10,
    unit: '1 kg',
  };

  const response: CartResponse = {
    message: 'Cart retrieved successfully',
    cart: { items: [] },
    subtotal: 0,
    deliveryFee: 0,
    tax: 0,
    orderTotal: 0,
    freeDeliveryThreshold: 20,
  };
  const translations: Record<string, string> = {
    'cartPage.emptyTitle': 'Your cart is empty',
    'cartPage.removeItem': 'Remove {{name}} from cart',
    'cartPage.decreaseQuantity': 'Decrease quantity of {{name}}',
    'cartPage.increaseQuantity': 'Increase quantity of {{name}}',
  };

  beforeEach(async () => {
    cart = {
      items: signal<CartItem[]>([{ productId: product, quantity: 2 }]),
      subtotal: signal(6),
      deliveryFee: signal(4),
      tax: signal(0.6),
      orderTotal: signal(10.6),
      freeDeliveryThreshold: signal(20),
      loading: signal(false),
      saving: signal(false),
      errorMessage: signal<string | null>(null),
      itemCount: signal(2),
      loadCart: vi.fn(() => of(response)),
      updateQuantity: vi.fn(() => of(response)),
      removeProduct: vi.fn(() => of(response)),
      clearCart: vi.fn(() => of(response)),
      retry: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CartPageComponent],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cart },
        {
          provide: LanguageService,
          useValue: {
            t: (key: string, params?: Record<string, string | number>) =>
              Object.entries(params ?? {}).reduce(
                (value, [name, replacement]) =>
                  value.replaceAll(`{{${name}}}`, String(replacement)),
                translations[key] ?? key,
              ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartPageComponent);
    fixture.detectChanges();
  });

  it('renders the empty-cart state and browse link', () => {
    cart.items.set([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Your cart is empty');
    expect(fixture.nativeElement.querySelector('a[href="/products"]')).not.toBeNull();
  });

  it('renders an item and exposes labeled quantity controls', () => {
    expect(fixture.nativeElement.textContent).toContain('Apples');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Decrease quantity of Apples"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[aria-label="Increase quantity of Apples"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[aria-label="Remove Apples from cart"]'),
    ).not.toBeNull();
  });

  it('routes quantity changes and removal to the cart service', () => {
    fixture.nativeElement.querySelector('[aria-label="Decrease quantity of Apples"]').click();
    fixture.nativeElement.querySelector('[aria-label="Increase quantity of Apples"]').click();
    fixture.nativeElement.querySelector('[aria-label="Remove Apples from cart"]').click();
    fixture.detectChanges();

    expect(cart.updateQuantity).toHaveBeenNthCalledWith(1, 'product-1', 1);
    expect(cart.updateQuantity).toHaveBeenNthCalledWith(2, 'product-1', 3);
    expect(cart.removeProduct).toHaveBeenCalledWith('product-1');
  });
});
