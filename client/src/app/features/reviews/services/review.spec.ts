import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ReviewService } from './review';

describe('ReviewService', () => {
  let service: ReviewService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReviewService],
    });
    service = TestBed.inject(ReviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests paginated product reviews', () => {
    service.getProductReviews('fresh-apples', 2, 10).subscribe();
    const request = httpMock.expectOne((item) => item.url === '/api/review/product');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('slug')).toBe('fresh-apples');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({
      message: 'Product reviews retrieved successfully',
      reviews: [],
      pagination: {
        page: 2,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: true,
      },
    });
  });

  it('requests reviewable order items', () => {
    service.getReviewableOrders().subscribe();
    const request = httpMock.expectOne('/api/review/reviewable');
    expect(request.request.method).toBe('GET');
    request.flush({ message: 'Reviewable order items retrieved successfully', orders: [] });
  });

  it('posts the exact review payload', () => {
    const payload = { orderId: 'order-1', orderItemId: 'item-1', rating: 5, comment: 'Great' };
    service.createReview(payload).subscribe();
    const request = httpMock.expectOne('/api/review');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ message: 'Review created successfully', review: { _id: 'review-1' } });
  });
});
