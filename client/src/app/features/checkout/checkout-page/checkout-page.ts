import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AddressService, type Address } from '../../addresses/services/address';
import { CartService } from '../../../core/cart/cart';
import { OrderService, type PaymentMethod } from '../services/order';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout-page.html',
})
export class CheckoutPageComponent {
  readonly cart = inject(CartService);
  readonly addressService = inject(AddressService);
  private readonly orderService = inject(OrderService);
  readonly selectedAddressId = signal<string | null>(null);
  readonly paymentMethod = signal<PaymentMethod>('cash_on_delivery');
  readonly placingOrder = signal(false);
  readonly orderError = signal<string | null>(null);
  readonly successOrderNumber = signal<string | null>(null);
  readonly successOrderId = signal<string | null>(null);

  constructor() {
    this.cart.loadCart().subscribe();
    this.addressService.loadAddresses().subscribe({
      next: (response) => {
        const selected =
          response.addresses.find((address) => address.isDefault) ?? response.addresses[0];
        this.selectedAddressId.set(selected?._id ?? null);
      },
    });
  }

  selectAddress(address: Address): void {
    this.selectedAddressId.set(address._id);
  }

  selectPaymentMethod(paymentMethod: PaymentMethod): void {
    this.paymentMethod.set(paymentMethod);
    this.orderError.set(null);
  }

  placeOrder(): void {
    const addressId = this.selectedAddressId();
    if (!addressId || this.cart.items().length === 0) {
      this.orderError.set(
        !addressId ? 'Select a delivery address before placing your order.' : 'Your cart is empty.',
      );
      return;
    }

    this.placingOrder.set(true);
    this.orderError.set(null);
    this.orderService.createOrder({ addressId, paymentMethod: this.paymentMethod() }).subscribe({
      next: (response) => {
        if (this.paymentMethod() === 'card') {
          if (response.stripeUrl) {
            window.location.assign(response.stripeUrl);
            return;
          }

          this.orderError.set('Card payment could not be started. Please try again.');
          return;
        }

        this.successOrderNumber.set(response.order.orderNo);
        this.successOrderId.set(response.order._id);
        this.cart.loadCart().subscribe();
      },
      error: () => this.orderError.set('Unable to place your order right now.'),
      complete: () => this.placingOrder.set(false),
    });
  }
}
