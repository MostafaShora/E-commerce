import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, switchMap, tap, throwError } from 'rxjs';

export type Address = {
	_id: string;
	recipientName: string;
	phone: string;
	street: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
	isDefault: boolean;
};

export type AddressInput = Omit<Address, '_id' | 'isDefault'>;

type AddressListResponse = {
	message: string;
	addresses: Address[];
};

type AddressResponse = {
	message: string;
	address: Address;
};

@Injectable({ providedIn: 'root' })
export class AddressService {
	readonly addresses = signal<Address[]>([]);
	readonly loading = signal(false);
	readonly saving = signal(false);
	readonly errorMessage = signal<string | null>(null);

	constructor(private readonly http: HttpClient) {}

	loadAddresses(): Observable<AddressListResponse> {
		this.loading.set(true);
		this.errorMessage.set(null);
		return this.http.get<AddressListResponse>('/api/address').pipe(
			tap((response) => this.addresses.set(response.addresses ?? [])),
			catchError((error: unknown) => {
				this.errorMessage.set('Unable to load your addresses right now.');
				return throwError(() => error);
			}),
			finalize(() => this.loading.set(false)),
		);
	}

	createAddress(input: AddressInput): Observable<AddressResponse> {
		return this.mutate(this.http.post<AddressResponse>('/api/address', input));
	}

	updateAddress(id: string, input: Partial<AddressInput>): Observable<AddressResponse> {
		return this.mutate(this.http.patch<AddressResponse>(`/api/address/${encodeURIComponent(id)}`, input));
	}

	deleteAddress(id: string): Observable<AddressResponse> {
		return this.mutate(this.http.delete<AddressResponse>(`/api/address/${encodeURIComponent(id)}`)).pipe(
			switchMap((response) => this.loadAddresses().pipe(map(() => response))),
		);
	}

	retry(): void {
		this.loadAddresses().subscribe();
	}

	private mutate(request: Observable<AddressResponse>): Observable<AddressResponse> {
		this.saving.set(true);
		this.errorMessage.set(null);
		return request.pipe(
			tap((response) => {
				const next = this.addresses().filter((item) => item._id !== response.address._id);
				this.addresses.set(response.address.isDefault
					? [response.address, ...next.map((item) => ({ ...item, isDefault: false }))]
					: [...next, response.address]);
			}),
			catchError((error: unknown) => {
				this.errorMessage.set('Unable to save your address changes.');
				return throwError(() => error);
			}),
			finalize(() => this.saving.set(false)),
		);
	}
}
