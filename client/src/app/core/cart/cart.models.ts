export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  salePrice: number;
  originalPrice: number;
  discountPercent?: number;
  discountLabel?: string;
  unit: string;
  stockCount?: number;
  quantity: number;
}

export type AddToCartItem = Omit<CartItem, 'quantity'>;

export interface CartSummary {
  subtotal: number | null;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  tax: number;
  orderTotal: number;
}

export interface UpdateCartItem {
  productId: string;
  quantity: number;
}