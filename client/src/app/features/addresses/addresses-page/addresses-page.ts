import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AddressService, type Address, type AddressInput } from '../services/address';

@Component({
  selector: 'app-addresses-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './addresses-page.html',
})
export class AddressesPageComponent {
  readonly addressService = inject(AddressService);
  readonly formBuilder = inject(FormBuilder);
  readonly editingId = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    recipientName: ['', Validators.required],
    phone: ['', Validators.required],
    street: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: ['', Validators.required],
  });

  constructor() {
    this.addressService.loadAddresses().subscribe();
  }

  startEdit(address: Address): void {
    this.editingId.set(address._id);
    this.form.patchValue(address);
    this.form.markAsPristine();
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const input = this.form.getRawValue() as AddressInput;
    const request = this.editingId()
      ? this.addressService.updateAddress(this.editingId()!, input)
      : this.addressService.createAddress(input);

    request.subscribe({
      next: () => {
        this.form.reset();
        this.editingId.set(null);
      },
    });
  }

  remove(address: Address): void {
    this.addressService.deleteAddress(address._id).subscribe();
  }

  controlInvalid(controlName: string): boolean {
    const control = this.form.controls[controlName as keyof typeof this.form.controls];
    return control.invalid && (control.touched || control.dirty);
  }
}
