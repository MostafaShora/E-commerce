/**
 * Image utility functions for handling product images with fallbacks
 */

// Fallback image URL - relative path from public assets
export const PRODUCT_IMAGE_FALLBACK = '/assets/images/product-img-1.jpeg';

/**
 * Get the first valid image URL from an array of image URLs
 * @param images - Array of image URLs
 * @param fallback - Optional fallback URL (defaults to PRODUCT_IMAGE_FALLBACK)
 * @returns The first image URL or fallback URL
 */
export function getProductImageUrl(images: string[] | undefined | null, fallback: string = PRODUCT_IMAGE_FALLBACK): string {
  if (Array.isArray(images) && images.length > 0 && images[0]?.trim()) {
    return images[0];
  }
  return fallback;
}

/**
 * Handle image loading error by setting fallback image
 * @param event - Image element error event
 * @param fallback - Optional fallback URL
 */
export function onImageError(event: Event, fallback: string = PRODUCT_IMAGE_FALLBACK): void {
  const imgElement = event.target as HTMLImageElement;
  if (imgElement && imgElement.src !== fallback) {
    imgElement.src = fallback;
  }
}
