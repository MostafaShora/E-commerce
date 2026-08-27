import { Injectable } from '@angular/core';

import type { CartItem, CartUpdateItem } from './cart';

@Injectable({ providedIn: 'root' })
export class CartStorage {
	private readonly storageKey = 'nexora-cart-snapshot';

	itemCount(items: CartItem[]): number {
		return items.reduce((total, item) => total + item.quantity, 0);
	}

	read(): CartUpdateItem[] {
		try {
			const raw = localStorage.getItem(this.storageKey);
			if (!raw) {
				return [];
			}

			const parsed: unknown = JSON.parse(raw);
			if (!Array.isArray(parsed)) {
				return [];
			}

			return parsed.filter(this.isSnapshotItem);
		} catch {
			return [];
		}
	}

	write(items: CartUpdateItem[]): void {
		localStorage.setItem(this.storageKey, JSON.stringify(items.filter((item) => item.quantity > 0)));
	}

	clear(): void {
		localStorage.removeItem(this.storageKey);
	}

	private isSnapshotItem(value: unknown): value is CartUpdateItem {
		if (!value || typeof value !== 'object') {
			return false;
		}

		const item = value as Record<string, unknown>;
		return typeof item['productId'] === 'string'
			&& typeof item['quantity'] === 'number'
			&& Number.isInteger(item['quantity'])
			&& item['quantity'] > 0;
	}
}
