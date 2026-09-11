import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { normalizeApiError } from '../../../core/api/api-error';

import type { CatalogProduct } from '../../../shared/models/catalog';
import type { CreatedOrder, OrderStatus } from '../../checkout/services/order';

export type AdminPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
};
export type AdminProductsResponse = {
  message: string;
  products: CatalogProduct[];
  pagination: AdminPagination;
};
export type AdminCategory = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { url: string; publicId: string } | null;
  isActive: boolean;
  productsCount: number;
};
export type AdminCategoriesResponse = {
  message: string;
  categories: AdminCategory[];
  pagination: AdminPagination;
};
export type AdminOrdersResponse = {
  message: string;
  orders: CreatedOrder[];
  pagination: AdminPagination;
};
export type AdminMutationResponse = {
  message: string;
  product?: CatalogProduct;
  category?: AdminCategory;
  order?: CreatedOrder;
};

export type CreateAdminProduct = {
  categoryId: string;
  name: string;
  description?: string;
  originalPrice: number;
  discountPercent?: number;
  discountLabel?: string;
  unit?: string;
  stockCount?: number;
  isActive?: boolean;
  images?: string[];
};

export type AdminAiRequest = {
  action: 'rephrase-title' | 'generate-desc';
  title: string;
  unit?: string;
  description?: string;
};

export type AdminAiResponse = {
  message: string;
  result: string;
};

export function getAiGenerationErrorMessage(error: unknown): string {
  const message = normalizeApiError(error).message;

  if (message === 'AI service is not configured') return message;
  if (message === 'AI service is busy. Please try again shortly.') return message;

  // Do not render raw provider / SDK errors if a proxy or a future backend
  // change returns one unexpectedly.
  return 'AI generation is currently unavailable. Please try again.';
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly http: HttpClient) {}

  getProducts(page = 1, limit = 20): Observable<AdminProductsResponse> {
    return this.http.get<AdminProductsResponse>('/api/product/admin', {
      params: new HttpParams().set('page', page).set('limit', limit),
    });
  }

  createProduct(value: CreateAdminProduct): Observable<AdminMutationResponse> {
    return this.http.post<AdminMutationResponse>('/api/product', value);
  }

  uploadProductImages(files: File[]): Observable<{ message: string; images: string[] }> {
    const body = new FormData();
    files.forEach((file) => body.append('images', file));
    return this.http.post<{ message: string; images: string[] }>('/api/product/images', body);
  }

  generateAi(value: AdminAiRequest): Observable<AdminAiResponse> {
    return this.http.post<AdminAiResponse>('/api/admin/ai/generate', value);
  }

  updateProduct(id: string, value: Record<string, unknown>): Observable<AdminMutationResponse> {
    return this.http.patch<AdminMutationResponse>(`/api/product/${id}`, value);
  }
  toggleProduct(id: string, active: boolean): Observable<AdminMutationResponse> {
    return this.http.patch<AdminMutationResponse>(
      `/api/product/${id}/${active ? 'activate' : 'deactivate'}`,
      {},
    );
  }
  deleteProduct(id: string): Observable<AdminMutationResponse> {
    return this.http.delete<AdminMutationResponse>(`/api/product/${id}`);
  }

  getCategories(page = 1, limit = 20): Observable<AdminCategoriesResponse> {
    return this.http.get<AdminCategoriesResponse>('/api/category/admin', {
      params: new HttpParams().set('page', page).set('limit', limit),
    });
  }
  createCategory(value: { name: string; description?: string; isActive: boolean }, image: File): Observable<AdminMutationResponse> {
    return this.http.post<AdminMutationResponse>('/api/category', this.categoryFormData(value, image));
  }
  updateCategory(id: string, value: { name: string; description?: string; isActive: boolean }, image?: File): Observable<AdminMutationResponse> {
    return this.http.patch<AdminMutationResponse>(`/api/category/${id}`, this.categoryFormData(value, image));
  }
  toggleCategory(id: string, active: boolean): Observable<AdminMutationResponse> {
    return this.http.patch<AdminMutationResponse>(
      `/api/category/${id}/${active ? 'activate' : 'deactivate'}`,
      {},
    );
  }
  deleteCategory(id: string): Observable<AdminMutationResponse> {
    return this.http.delete<AdminMutationResponse>(`/api/category/${id}`);
  }

  private categoryFormData(value: { name: string; description?: string; isActive: boolean }, image?: File): FormData {
    const body = new FormData();
    body.set('name', value.name.trim());
    if (value.description?.trim()) body.set('description', value.description.trim());
    body.set('isActive', String(value.isActive));
    if (image) body.set('image', image);
    return body;
  }

  getOrders(page = 1, limit = 10, status?: OrderStatus): Observable<AdminOrdersResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<AdminOrdersResponse>('/api/order/admin/all', { params });
  }
  updateOrderStatus(
    id: string,
    status: OrderStatus,
    note?: string,
  ): Observable<AdminMutationResponse> {
    return this.http.patch<AdminMutationResponse>(`/api/order/admin/${id}/status`, {
      status,
      note,
    });
  }
}
