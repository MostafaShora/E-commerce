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

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly http: HttpClient) {}

  getProducts(page = 1, limit = 20): Observable<AdminProductsResponse> {
    return this.http.get<AdminProductsResponse>('/api/product/admin', {
      params: new HttpParams().set('page', page).set('limit', limit),
    });
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
