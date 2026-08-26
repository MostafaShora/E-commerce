export type CatalogCategory = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  image?: {
    url: string;
    publicId: string;
  } | null;
};

export type CatalogCategoryResponse = {
  message: string;
  categories: CatalogCategory[];
};

export type CatalogProduct = {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  discountLabel?: string | null;
  unit: string;
  stockCount: number;
  ratingAverage: number;
  reviewCount: number;
  description?: string;
};

export type CatalogProductsResponse = {
  message: string;
  products: CatalogProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};
