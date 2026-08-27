import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly http: HttpClient) {}

  getProducts(page = 1, limit = 20): Observable<AdminProductsResponse> {
    return this.http.get<AdminProductsResponse>('/api/product/admin', {
      params: new HttpParams().set('page', page).set('limit', limit),
    });
  }

  createProduct(value: CreateAdminProduct, image: File): Observable<AdminMutationResponse> {
    const body = new FormData();
    body.append('image', image);
    body.append('categoryId', value.categoryId);
    body.append('name', value.name);
    body.append('description', value.description ?? '');
    body.append('originalPrice', String(value.originalPrice));
    body.append('discountPercent', String(value.discountPercent ?? 0));
    body.append('discountLabel', value.discountLabel ?? '');
    body.append('unit', value.unit ?? 'pc');
    body.append('stockCount', String(value.stockCount ?? 0));
    body.append('isActive', String(value.isActive ?? true));
    return this.http.post<AdminMutationResponse>('/api/product', body);
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
  updateCategory(id: string, value: Record<string, unknown>): Observable<AdminMutationResponse> {
    return this.http.patch<AdminMutationResponse>(`/api/category/${id}`, value);
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
