import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  type CatalogCategoryResponse,
  type CatalogProduct,
  type CatalogProductsResponse,
} from '../../../shared/models/catalog';

@Injectable({ providedIn: 'root' })
export class HomeService {
  constructor(private readonly http: HttpClient) {}

  getCategories(): Observable<CatalogCategoryResponse> {
    return this.http.get<CatalogCategoryResponse>('/api/category');
  }

  getDeals(limit = 6): Observable<{ message: string; products: CatalogProduct[] }> {
    const params = new HttpParams().set('limit', String(limit));

    return this.http.get<{ message: string; products: CatalogProduct[] }>(
      '/api/product/deals',
      { params },
    );
  }

  getProducts(limit = 12): Observable<CatalogProductsResponse> {
    const params = new HttpParams().set('limit', String(limit));

    return this.http.get<CatalogProductsResponse>('/api/product', {
      params,
    });
  }
}
