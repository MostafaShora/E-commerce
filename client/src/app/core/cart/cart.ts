import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import {
	catchError,
	debounceTime,
	finalize,
	map,
	Observable,
	of,
	ReplaySubject,
	Subject,
	switchMap,
	tap,
	throwError,
	} from 'rxjs';

import type { CatalogProduct } from '../../shared/models/catalog';
import { CartStorage } from './cart-storage';
import { NotificationService } from '../services/notification';

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

type PendingSync = {
	items: CartUpdateItem[];
	previousItems: CartItem[];
	optimisticProduct?: CartProduct;
	result: ReplaySubject<CartResponse>;
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
	readonly isOpen = signal(false);
	readonly errorMessage = signal<string | null>(null);
	readonly itemCount = computed(() => this.items().reduce((total, item) => total + item.quantity, 0));
	private hasLoaded = false;
	private readonly syncRequests = new Subject<PendingSync>();
	private activeSync: PendingSync | null = null;
	private queuedSync: PendingSync | null = null;

	constructor(
		private readonly http: HttpClient,
		private readonly storage: CartStorage,
		private readonly notifications: NotificationService,
	) {
		this.syncRequests.pipe(
			debounceTime(500),
			switchMap((request) => {
				this.queuedSync = null;
				this.activeSync = request;
				return this.http.post<CartResponse>('/api/cart', { items: request.items }).pipe(
					tap((response) => {
						this.applyResponse(response);
						this.storage.write(this.toUpdateItems());
						this.notifications.success('Cart saved successfully.');
						request.result.next(response);
						request.result.complete();
					}),
					catchError((error: unknown) => {
						this.items.set(request.previousItems);
						this.storage.write(this.toUpdateItems());
						this.subtotal.set(0);
						this.deliveryFee.set(0);
						this.tax.set(0);
						this.orderTotal.set(0);
						this.errorMessage.set('Unable to save your cart changes.');
						this.notifications.error('Cart update failed. Changes were reverted.');
						request.result.error(error);
						return of(null);
					}),
					finalize(() => {
						if (this.activeSync === request) {
							this.activeSync = null;
						}
						this.saving.set(false);
					}),
				);
			}),
		).subscribe();
	}

	loadCart(): Observable<CartResponse> {
		this.loading.set(true);
		this.errorMessage.set(null);
		return this.http.get<CartResponse>('/api/cart').pipe(
			tap((response) => {
				this.applyResponse(response);
				this.storage.write(this.toUpdateItems());
			}),
			catchError((error: unknown) => {
				this.errorMessage.set('Unable to load your cart right now.');
				return throwError(() => error);
			}),
			finalize(() => this.loading.set(false)),
		);
	}

	addProduct(product: CartProduct | string, quantity = 1): Observable<CartResponse> {
		const productId = typeof product === 'string' ? product : product._id;
		const loadedCart: Observable<CartResponse | null> = this.hasLoaded
			? of(null)
			: this.loadCart().pipe(map((response) => response));
		return loadedCart.pipe(
			switchMap(() => {
				const existing = this.items().find((item) => item.productId._id === productId);
				const items = this.toUpdateItems().filter((item) => item.productId !== productId);
				const nextQuantity = (existing?.quantity ?? 0) + quantity;
				if (typeof product !== 'string' && product.stockCount < nextQuantity) {
					this.notifications.error(`Only ${product.stockCount} units available in stock.`);
					return throwError(() => new Error('Insufficient stock'));
				}
				items.push({ productId, quantity: nextQuantity });
				return this.saveItems(items, typeof product === 'string' ? undefined : product);
			}),
		);
	}

	updateQuantity(productId: string, quantity: number): Observable<CartResponse> {
		const current = this.items().find((item) => item.productId._id === productId);
		if (current && quantity > current.productId.stockCount) {
			this.notifications.error(`Only ${current.productId.stockCount} units available in stock.`);
			return throwError(() => new Error('Insufficient stock'));
		}
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
		this.isOpen.set(false);
		this.hasLoaded = false;
	}

	open(): void {
		this.isOpen.set(true);
		if (!this.hasLoaded) {
			this.loadCart().subscribe();
		}
	}

	close(): void {
		this.isOpen.set(false);
	}

	retry(): void {
		this.loadCart().subscribe();
	}

	private saveItems(items: CartUpdateItem[], optimisticProduct?: CartProduct): Observable<CartResponse> {
		const previousItems = this.items();
		this.items.set(this.withUpdatedItems(items, optimisticProduct));
		this.storage.write(items);
		this.saving.set(true);
		this.errorMessage.set(null);
		const result = new ReplaySubject<CartResponse>(1);
		this.queuedSync?.result.complete();
		this.queuedSync = { items, previousItems, optimisticProduct, result };
		this.syncRequests.next(this.queuedSync);
		return result.asObservable().pipe(
			catchError((error: unknown) => throwError(() => error)),
		);
	}

	private toUpdateItems(): CartUpdateItem[] {
		return this.items().map((item) => ({
			productId: item.productId._id,
			quantity: item.quantity,
		}));
	}

	private withUpdatedItems(items: CartUpdateItem[], optimisticProduct?: CartProduct): CartItem[] {
		return items.flatMap((update) => {
			const current = this.items().find((item) => item.productId._id === update.productId);
			if (current && update.quantity > 0) {
				return [{ ...current, quantity: update.quantity }];
			}
			return optimisticProduct?._id === update.productId && update.quantity > 0
				? [{ productId: optimisticProduct, quantity: update.quantity }]
				: [];
		});
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
