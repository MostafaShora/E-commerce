import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewportScroller } from '@angular/common';
import {
  ActivatedRoute,
  convertToParamMap,
  NavigationEnd,
  ParamMap,
  Router,
  Scroll,
} from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { CatalogService } from '../services/catalog';
import { HomeService } from '../../home/services/home';
import { ProductsPage } from './products-page';

describe('ProductsPage', () => {
  let component: ProductsPage;
  let fixture: ComponentFixture<ProductsPage>;
  let queryParams: BehaviorSubject<ParamMap>;
  let catalogService: { getProducts: ReturnType<typeof vi.fn> };
  let router: { events: Subject<unknown>; navigate: ReturnType<typeof vi.fn> };
  let routerEvents: Subject<unknown>;
  let viewportScroller: {
    getScrollPosition: ReturnType<typeof vi.fn>;
    scrollToPosition: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    queryParams = new BehaviorSubject(convertToParamMap({}));
    routerEvents = new Subject<unknown>();
    viewportScroller = {
      getScrollPosition: vi.fn((): [number, number] => [0, 1240]),
      scrollToPosition: vi.fn(),
    };
    catalogService = {
      getProducts: vi.fn((query) =>
        of({
          message: 'Products retrieved successfully',
          products: [],
          pagination: {
            page: query.page,
            limit: query.limit,
            total: 45,
            totalPages: 3,
            hasNextPage: query.page < 3,
            hasPrevPage: query.page > 1,
          },
        }),
      ),
    };
    router = {
      events: routerEvents,
      navigate: vi.fn((_commands, options) => {
        const nextParams: Record<string, string> = Object.fromEntries(
          queryParams.value.keys.flatMap((key) => {
            const value = queryParams.value.get(key);
            return value === null ? [] : [[key, value]];
          }),
        );

        for (const [key, value] of Object.entries(options.queryParams)) {
          if (value === null || value === undefined) {
            delete nextParams[key];
          } else {
            nextParams[key] = String(value);
          }
        }

        queryParams.next(convertToParamMap(nextParams));
        return Promise.resolve(true);
      }),
    };

    await TestBed.configureTestingModule({
      imports: [ProductsPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParams.asObservable(),
            snapshot: { get queryParamMap() { return queryParams.value; } },
          },
        },
        { provide: Router, useValue: router },
        { provide: ViewportScroller, useValue: viewportScroller },
        {
          provide: HomeService,
          useValue: { getCategories: () => of({ categories: [] }) },
        },
        { provide: CatalogService, useValue: catalogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(catalogService.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, sort: 'best-match' }),
    );
  });

  it('requests combined filters and keeps decimal price bounds', () => {
    component.filters.patchValue({ dealsOnly: true, inStockOnly: true });
    component.priceInputs.setValue({ min: '2.5', max: '10.75' });
    component.applyPriceFilter();

    expect(queryParams.value.get('page')).toBe('1');
    expect(queryParams.value.get('hasDiscount')).toBe('true');
    expect(queryParams.value.get('inStock')).toBe('true');
    expect(queryParams.value.get('minPrice')).toBe('2.5');
    expect(queryParams.value.get('maxPrice')).toBe('10.75');
    expect(catalogService.getProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        hasDiscount: true,
        inStock: true,
        minPrice: 2.5,
        maxPrice: 10.75,
      }),
    );
  });

  it('resets pagination for filters and sort, but preserves filters when changing page', () => {
    queryParams.next(convertToParamMap({ category: 'category-1', page: '2' }));
    expect(catalogService.getProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryId: 'category-1', page: 2 }),
    );

    component.goToPage(3);
    expect(queryParams.value.get('page')).toBe('3');
    expect(catalogService.getProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryId: 'category-1', page: 3 }),
    );

    component.filters.controls.sort.setValue('price-low');
    expect(queryParams.value.get('page')).toBe('1');
    expect(queryParams.value.get('sort')).toBe('price-low');
    expect(queryParams.value.get('category')).toBe('category-1');
    expect(catalogService.getProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryId: 'category-1', page: 1, sort: 'price-low' }),
    );
  });

  it('resets page when category changes and clears all filters on reset', () => {
    component.filters.patchValue({ dealsOnly: true, inStockOnly: true });
    component.selectCategory('category-2');

    expect(queryParams.value.get('category')).toBe('category-2');
    expect(queryParams.value.get('page')).toBe('1');
    expect(catalogService.getProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryId: 'category-2', page: 1, hasDiscount: true, inStock: true }),
    );

    component.resetFilters();
    expect(queryParams.value.get('category')).toBeNull();
    expect(queryParams.value.get('page')).toBe('1');
    expect(queryParams.value.get('hasDiscount')).toBeNull();
    expect(queryParams.value.get('inStock')).toBeNull();
    expect(queryParams.value.get('sort')).toBe('best-match');
    expect(catalogService.getProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, sort: 'best-match', hasDiscount: undefined, inStock: undefined }),
    );
  });

  it('rejects inverted price ranges without updating the request', () => {
    const requestCount = catalogService.getProducts.mock.calls.length;
    component.priceInputs.setValue({ min: '12.5', max: '2.25' });
    component.applyPriceFilter();

    expect(component.priceValidationError()).toBe(
      'Minimum price cannot be greater than maximum price.',
    );
    expect(catalogService.getProducts).toHaveBeenCalledTimes(requestCount);
  });

  it('preserves listing scroll when filter changes update only query parameters', async () => {
    component.filters.controls.dealsOnly.setValue(true);
    routerEvents.next(
      new Scroll(new NavigationEnd(2, '/products?page=1&hasDiscount=true', '/products'), null, null),
    );
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    expect(viewportScroller.getScrollPosition).toHaveBeenCalled();
    expect(viewportScroller.scrollToPosition).toHaveBeenCalledWith([0, 1240]);
  });
});
