import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

import type { CatalogProduct } from '../../shared/models/catalog';

export type CartProduct = Pick<
	CatalogProduct,
	'_id' | 'name' | 'slug' | 'images' | 'salePrice' | 'originalPrice' | 'discountPercent' | 'stockCount'
> & {
	unit?: string;
	discountLabel?: string | null;
};

export type CartItem = {
	productId: CartProduct;
	quantity: number;
};

export type CartResponse = {
	message: string;
	cart: {
		items: CartItem[];
	};
	subtotal: number;
	deliveryFee: number;
	tax: number;
	orderTotal: number;
	freeDeliveryThreshold: number;
};

export type CartUpdateItem = {
	productId: string;
	quantity: number;
};

@Injectable({ providedIn: 'root' })
export class CartService {
	readonly items = signal<CartItem[]>([]);
	readonly subtotal = signal(0);
	readonly deliveryFee = signal(0);
	readonly tax = signal(0);
	readonly orderTotal = signal(0);
	readonly freeDeliveryThreshold = signal(0);
	readonly loading = signal(false);
	readonly saving = signal(false);
	readonly errorMessage = signal<string | null>(null);
	readonly itemCount = computed(() => this.items().reduce((total, item) => total + item.quantity, 0));
	private hasLoaded = false;

	constructor(private readonly http: HttpClient) {}

	loadCart(): Observable<CartResponse> {
		this.loading.set(true);
		this.errorMessage.set(null);
		return this.http.get<CartResponse>('/api/cart').pipe(
			tap((response) => this.applyResponse(response)),
			catchError((error: unknown) => {
				this.errorMessage.set('Unable to load your cart right now.');
				return throwError(() => error);
			}),
			finalize(() => this.loading.set(false)),
		);
	}

	addProduct(productId: string, quantity = 1): Observable<CartResponse> {
		const loadedCart: Observable<CartResponse | null> = this.hasLoaded
			? of(null)
			: this.loadCart().pipe(map((response) => response));
		return loadedCart.pipe(
			switchMap(() => {
				const existing = this.items().find((item) => item.productId._id === productId);
				const items = this.toUpdateItems().filter((item) => item.productId !== productId);
				items.push({ productId, quantity: (existing?.quantity ?? 0) + quantity });
				return this.saveItems(items);
			}),
		);
	}

	updateQuantity(productId: string, quantity: number): Observable<CartResponse> {
		const items = this.toUpdateItems()
			.map((item) => item.productId === productId ? { ...item, quantity } : item)
			.filter((item) => item.quantity > 0);
		return this.saveItems(items);
	}

	removeProduct(productId: string): Observable<CartResponse> {
		return this.saveItems(this.toUpdateItems().filter((item) => item.productId !== productId));
	}

	clearCart(): Observable<CartResponse> {
		return this.saveItems([]);
	}

	resetSessionState(): void {
		this.items.set([]);
		this.subtotal.set(0);
		this.deliveryFee.set(0);
		this.tax.set(0);
		this.orderTotal.set(0);
		this.freeDeliveryThreshold.set(0);
		this.errorMessage.set(null);
		this.loading.set(false);
		this.saving.set(false);
		this.hasLoaded = false;
	}

	retry(): void {
		this.loadCart().subscribe();
	}

	private saveItems(items: CartUpdateItem[]): Observable<CartResponse> {
		this.saving.set(true);
		this.errorMessage.set(null);
		return this.http.post<CartResponse>('/api/cart', { items }).pipe(
			tap((response) => this.applyResponse(response)),
			catchError((error: unknown) => {
				this.errorMessage.set('Unable to save your cart changes.');
				return throwError(() => error);
			}),
			finalize(() => this.saving.set(false)),
		);
	}

	private toUpdateItems(): CartUpdateItem[] {
		return this.items().map((item) => ({
			productId: item.productId._id,
			quantity: item.quantity,
		}));
	}

	private applyResponse(response: CartResponse): void {
		this.items.set(response.cart?.items ?? []);
		this.subtotal.set(response.subtotal ?? 0);
		this.deliveryFee.set(response.deliveryFee ?? 0);
		this.tax.set(response.tax ?? 0);
		this.orderTotal.set(response.orderTotal ?? 0);
		this.freeDeliveryThreshold.set(response.freeDeliveryThreshold ?? 0);
		this.loading.set(false);
		this.saving.set(false);
		this.hasLoaded = true;
	}
}
