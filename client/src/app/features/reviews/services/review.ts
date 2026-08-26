import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type ReviewUser = {
  _id?: string;
  name: string;
  avatar?: string | null;
};

export type ProductReview = {
  _id: string;
  userId: ReviewUser | string;
  orderId: string;
  orderItemId: string;
  productId: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type ReviewPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type ProductReviewsResponse = {
  message: string;
  reviews: ProductReview[];
  pagination: ReviewPagination;
};

export type ReviewableOrderItem = {
  _id: string;
  productId: string;
  name: string;
  image: string;
  originalPrice: number;
  salePrice: number;
  quantity: number;
  isReviewed: boolean;
};

export type ReviewableOrder = {
  _id: string;
  orderNo: string;
  createdAt: string;
  items: ReviewableOrderItem[];
};

export type ReviewableOrdersResponse = {
  message: string;
  orders: ReviewableOrder[];
};

export type CreateReviewRequest = {
  orderId: string;
  orderItemId: string;
  rating: number;
  comment?: string;
};

export type CreateReviewResponse = {
  message: string;
  review: ProductReview;
};

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private readonly http: HttpClient) {}

  getProductReviews(slug: string, page = 1, limit = 10): Observable<ProductReviewsResponse> {
    const params = new HttpParams()
      .set('slug', slug)
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get<ProductReviewsResponse>('/api/review/product', { params });
  }

  getReviewableOrders(): Observable<ReviewableOrdersResponse> {
    return this.http.get<ReviewableOrdersResponse>('/api/review/reviewable');
  }

  createReview(request: CreateReviewRequest): Observable<CreateReviewResponse> {
    return this.http.post<CreateReviewResponse>('/api/review', request);
  }
}
