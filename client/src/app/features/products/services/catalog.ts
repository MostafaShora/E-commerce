import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import type { CatalogProductsResponse, ProductSort } from '../../../shared/models/catalog';

export type CatalogQuery = {
  categoryId?: string;
  page: number;
  limit: number;
  hasDiscount?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  keyword?: string;
  skip?: number;
};

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private readonly http: HttpClient) {}

  getProducts(query: CatalogQuery): Observable<CatalogProductsResponse> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('limit', String(query.limit));

    if (query.categoryId) params = params.set('categoryId', query.categoryId);
    if (query.hasDiscount !== undefined) params = params.set('hasDiscount', String(query.hasDiscount));
    if (query.inStock !== undefined) params = params.set('inStock', String(query.inStock));
    if (query.minPrice !== undefined) params = params.set('minPrice', String(query.minPrice));
    if (query.maxPrice !== undefined) params = params.set('maxPrice', String(query.maxPrice));
    if (query.sort) params = params.set('sort', query.sort);
    if (query.keyword) params = params.set('keyword', query.keyword);
    if (query.skip !== undefined) params = params.set('skip', String(query.skip));

    return this.http.get<CatalogProductsResponse>('/api/product', { params });
  }
}
