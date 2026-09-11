export type PendingProductImage = {
  file: File;
  preview: string;
};

const PRODUCT_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;

export function prepareProductImages(files: File[]): {
  images: PendingProductImage[];
  error: string | null;
} {
  const invalidType = files.find((file) => !PRODUCT_IMAGE_TYPES.has(file.type));
  if (invalidType) {
    return { images: [], error: 'Only JPEG, PNG, and WebP images are allowed.' };
  }
  const oversized = files.find((file) => file.size > MAX_PRODUCT_IMAGE_SIZE);
  if (oversized) {
    return { images: [], error: 'Each image must not exceed 5MB.' };
  }
  return {
    images: files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    error: null,
  };
}

export function orderStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'delivered': return 'status-delivered';
    case 'confirmed': return 'status-confirmed';
    case 'assigned': return 'status-assigned';
    case 'packed': return 'status-packed';
    case 'out_for_delivery': return 'status-out-for-delivery';
    case 'cancelled': return 'status-cancelled';
    case 'placed':
    default: return 'status-placed';
  }
}

export function paymentStatusClass(status: string): string {
  return status.toLowerCase() === 'paid' ? 'status-paid' : 'status-payment-pending';
}
