import { Injectable } from '@angular/core';

import type { CartItem } from './cart';

@Injectable({ providedIn: 'root' })
export class CartStorage {
	itemCount(items: CartItem[]): number {
		return items.reduce((total, item) => total + item.quantity, 0);
	}
}
