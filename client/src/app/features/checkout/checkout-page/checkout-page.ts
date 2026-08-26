import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AddressService, type Address } from '../../addresses/services/address';
import { CartService } from '../../../core/cart/cart';
import { OrderService } from '../services/order';

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
  readonly placingOrder = signal(false);
  readonly orderError = signal<string | null>(null);
  readonly successOrderNumber = signal<string | null>(null);

  constructor() {
    this.cart.loadCart().subscribe();
    this.addressService.loadAddresses().subscribe({
      next: (response) => {
        const selected = response.addresses.find((address) => address.isDefault) ?? response.addresses[0];
        this.selectedAddressId.set(selected?._id ?? null);
      },
    });
  }

  selectAddress(address: Address): void {
    this.selectedAddressId.set(address._id);
  }

  placeOrder(): void {
    const addressId = this.selectedAddressId();
    if (!addressId || this.cart.items().length === 0) {
      this.orderError.set(!addressId ? 'Select a delivery address before placing your order.' : 'Your cart is empty.');
      return;
    }

    this.placingOrder.set(true);
    this.orderError.set(null);
    this.orderService.createOrder({ addressId, paymentMethod: 'cash_on_delivery' }).subscribe({
      next: (response) => {
        this.successOrderNumber.set(response.order.orderNo);
        this.cart.loadCart().subscribe();
      },
      error: () => this.orderError.set('Unable to place your order right now.'),
      complete: () => this.placingOrder.set(false),
    });
  }
}
