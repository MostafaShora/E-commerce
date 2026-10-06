import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideCheck,
  LucideMapPin,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
} from '@lucide/angular';

import { normalizeApiError } from '../../../core/api/api-error';
import { LanguageService } from '../../../core/services/language';
import { AddressService, type Address, type AddressInput } from '../services/address';

@Component({
  selector: 'app-addresses-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideMapPin, LucidePlus, LucidePencil, LucideTrash2, LucideCheck],
  templateUrl: './addresses-page.html',
})
export class AddressesPageComponent {
  readonly addressService = inject(AddressService);
  readonly formBuilder = inject(FormBuilder);
  readonly language = inject(LanguageService);
  readonly editingId = signal<string | null>(null);
  readonly formOpen = signal(false);
  readonly deleteTarget = signal<Address | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly operationError = signal<string | null>(null);
  readonly fields = computed(() => [
    {
      name: 'recipientName',
      label: this.language.t('addressesPage.fields.recipientName'),
      placeholder: this.language.t('addressesPage.fields.recipientPlaceholder'),
    },
    {
      name: 'phone',
      label: this.language.t('addressesPage.fields.phone'),
      placeholder: this.language.t('addressesPage.fields.phonePlaceholder'),
    },
    {
      name: 'street',
      label: this.language.t('addressesPage.fields.street'),
      placeholder: this.language.t('addressesPage.fields.streetPlaceholder'),
    },
    {
      name: 'city',
      label: this.language.t('addressesPage.fields.city'),
      placeholder: this.language.t('addressesPage.fields.cityPlaceholder'),
    },
    {
      name: 'state',
      label: this.language.t('addressesPage.fields.state'),
      placeholder: this.language.t('addressesPage.fields.statePlaceholder'),
    },
    {
      name: 'postalCode',
      label: this.language.t('addressesPage.fields.postalCode'),
      placeholder: this.language.t('addressesPage.fields.postalPlaceholder'),
    },
    {
      name: 'country',
      label: this.language.t('addressesPage.fields.country'),
      placeholder: this.language.t('addressesPage.fields.countryPlaceholder'),
    },
  ]);

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
    this.formOpen.set(true);
    this.successMessage.set(null);
    this.operationError.set(null);
    this.form.patchValue(address);
    this.form.markAsPristine();
  }

  startCreate(): void {
    this.editingId.set(null);
    this.formOpen.set(true);
    this.successMessage.set(null);
    this.operationError.set(null);
    this.form.reset();
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.formOpen.set(false);
    this.form.reset();
  }

  submit(): void {
    this.successMessage.set(null);
    this.operationError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const input = this.form.getRawValue() as AddressInput;
    const request = this.editingId()
      ? this.addressService.updateAddress(this.editingId()!, input)
      : this.addressService.createAddress(input);

    request.subscribe({
      next: (response) => {
        this.form.reset();
        this.editingId.set(null);
        this.formOpen.set(false);
        this.successMessage.set(response.message);
      },
      error: (error: unknown) => this.operationError.set(normalizeApiError(error).message),
    });
  }

  remove(address: Address): void {
    this.deleteTarget.set(address);
    this.successMessage.set(null);
    this.operationError.set(null);
  }

  dismissDelete(): void {
    if (!this.addressService.saving()) this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const address = this.deleteTarget();
    if (!address || this.addressService.saving()) return;

    this.addressService.deleteAddress(address._id).subscribe({
      next: (response) => {
        this.deleteTarget.set(null);
        this.successMessage.set(response.message);
      },
      error: (error: unknown) => {
        this.operationError.set(normalizeApiError(error).message);
      },
    });
  }

  controlInvalid(controlName: string): boolean {
    const control = this.form.controls[controlName as keyof typeof this.form.controls];
    return control.invalid && (control.touched || control.dirty);
  }
}
