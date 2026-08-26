import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import type { ProductDetailResponse } from '../../../shared/models/catalog';

@Injectable({ providedIn: 'root' })
export class ProductDetailService {
  constructor(private readonly http: HttpClient) {}

  getProductBySlug(slug: string): Observable<ProductDetailResponse> {
    return this.http.get<ProductDetailResponse>(`/api/product/${encodeURIComponent(slug)}`);
  }
}
