export const PRODUCT_IMAGE_FALLBACK = '/assets/images/product-img-1.jpeg';

type ImageItem = string | { url?: string | null };

export function getProductImageUrl(
  images: ImageItem[] | string | undefined | null,
  fallback: string = PRODUCT_IMAGE_FALLBACK,
): string {
  // Single string image
  if (typeof images === 'string' && images.trim()) {
    return images;
  }

  // Array of images
  if (Array.isArray(images)) {
    const firstValidImage = images.find((image) => {
      if (typeof image === 'string') {
        return image.trim().length > 0;
      }

      return typeof image?.url === 'string' && image.url.trim().length > 0;
    });

    if (typeof firstValidImage === 'string') {
      return firstValidImage;
    }

    if (firstValidImage && typeof firstValidImage.url === 'string' && firstValidImage.url.trim()) {
      return firstValidImage.url;
    }
  }

  return fallback;
}

export function onImageError(event: Event, fallback: string = PRODUCT_IMAGE_FALLBACK): void {
  const imgElement = event.target as HTMLImageElement;

  if (imgElement && imgElement.src !== fallback) {
    imgElement.src = fallback;
  }
}
