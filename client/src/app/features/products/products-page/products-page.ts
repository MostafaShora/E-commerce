import { CommonModule, ViewportScroller } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, Scroll } from '@angular/router';
import { catchError, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';
import { MatCheckboxModule } from '@angular/material/checkbox';

import type {
  CatalogCategory,
  CatalogProduct,
  CatalogProductsPagination,
  ProductSort,
} from '../../../shared/models/catalog';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { HomeService } from '../../home/services/home';
import { CatalogService, type CatalogQuery } from '../services/catalog';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProductCardComponent, MatCheckboxModule],
  templateUrl: './products-page.html',
})
export class ProductsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly homeService = inject(HomeService);
  private readonly catalogService = inject(CatalogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<CatalogCategory[]>([]);
  readonly products = signal<CatalogProduct[]>([]);
  readonly pagination = signal<CatalogProductsPagination | null>(null);
  readonly loading = signal(true);
  readonly categoriesLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly categoriesError = signal<string | null>(null);
  readonly priceValidationError = signal<string | null>(null);
  readonly selectedCategory = signal('all');
  readonly currentCategoryName = signal('All');

  readonly filters = new FormGroup({
    dealsOnly: new FormControl(false, { nonNullable: true }),
    inStockOnly: new FormControl(false, { nonNullable: true }),
    minPrice: new FormControl('', { nonNullable: true }),
    maxPrice: new FormControl('', { nonNullable: true }),
    sort: new FormControl<ProductSort>('best-match', { nonNullable: true }),
  });

  readonly priceInputs = new FormGroup({
    min: new FormControl('', { nonNullable: true }),
    max: new FormControl('', { nonNullable: true }),
  });

  private pendingHistoryScrollPosition: [number, number] | null = null;
  private pendingQueryScrollPosition: [number, number] | null = null;

  constructor() {
    this.loadCategories();
    this.router.events
      .pipe(
        filter((event): event is Scroll => event instanceof Scroll),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        if (event.position) {
          this.pendingQueryScrollPosition = null;
          this.pendingHistoryScrollPosition = event.position;
          if (!this.loading()) {
            this.restoreHistoryScrollPosition();
          }
          return;
        }

        if (this.pendingQueryScrollPosition && !this.loading()) {
          this.restoreQueryScrollPosition();
        }
      });

    this.route.queryParamMap
      .pipe(
        map((params) => ({
          category: params.get('category') ?? 'all',
          page: this.parsePage(params.get('page')),
          dealsOnly: params.get('hasDiscount') === 'true',
          inStockOnly: params.get('inStock') === 'true',
          minPrice: params.get('minPrice') ?? '',
          maxPrice: params.get('maxPrice') ?? '',
          sort: this.parseSort(params.get('sort')),
          keyword: params.get('keyword') ?? undefined,
        })),
        distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
        switchMap((state) => {
          this.selectedCategory.set(state.category);
          this.currentCategoryName.set(
            this.categories().find((item) => item._id === state.category)?.name ??
            (state.category === 'all' ? 'All' : 'Category'),
          );
          this.filters.patchValue({
            dealsOnly: state.dealsOnly,
            inStockOnly: state.inStockOnly,
            minPrice: state.minPrice,
            maxPrice: state.maxPrice,
            sort: state.sort,
          }, { emitEvent: false });
          this.priceInputs.patchValue({ min: state.minPrice, max: state.maxPrice }, { emitEvent: false });

          const priceError = this.getPriceRangeError(state.minPrice, state.maxPrice);
          this.priceValidationError.set(priceError);
          if (priceError) {
            this.products.set([]);
            this.pagination.set(null);
            this.errorMessage.set(null);
            this.loading.set(false);
            this.restoreHistoryScrollPosition();
            this.restoreQueryScrollPosition();
            return of(null);
          }

          return this.loadProducts({
            categoryId: state.category === 'all' ? undefined : state.category,
            page: state.page,
            hasDiscount: state.dealsOnly ? true : undefined,
            inStock: state.inStockOnly ? true : undefined,
            minPrice: this.toPrice(state.minPrice),
            maxPrice: this.toPrice(state.maxPrice),
            sort: state.sort,
            keyword: state.keyword,
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.filters.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncListingQuery({ page: 1 }));
  }

  applyPriceFilter(): void {
    const minPrice = this.priceInputs.controls.min.value;
    const maxPrice = this.priceInputs.controls.max.value;
    const priceError = this.getPriceRangeError(minPrice, maxPrice);
    if (priceError) {
      this.priceValidationError.set(priceError);
      return;
    }

    this.priceValidationError.set(null);
    this.filters.patchValue({
      minPrice,
      maxPrice,
    });
  }

  selectCategory(category: string): void {
    this.syncListingQuery({ category, page: 1 });
  }

  resetFilters(): void {
    this.priceInputs.reset({ min: '', max: '' }, { emitEvent: false });
    this.filters.reset({
      dealsOnly: false,
      inStockOnly: false,
      minPrice: '',
      maxPrice: '',
      sort: 'best-match',
    }, { emitEvent: false });
    this.priceValidationError.set(null);
    this.syncListingQuery({ category: 'all', page: 1 });
  }

  goToPage(page: number): void {
    const current = this.pagination();
    if (!current || page < 1 || page > current.totalPages || page === current.page) {
      return;
    }

    this.syncListingQuery({ page });
  }

  retryProducts(): void {
    const page = this.parsePage(this.route.snapshot.queryParamMap.get('page'));
    this.loadProducts({ page }).subscribe();
  }

  private loadCategories(): void {
    this.categoriesLoading.set(true);
    this.homeService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.categories.set(response.categories ?? []);
          const category = this.selectedCategory();
          this.currentCategoryName.set(
            this.categories().find((item) => item._id === category)?.name ??
            (category === 'all' ? 'All' : 'Category'),
          );
        },
        error: () => this.categoriesError.set('Unable to load categories right now.'),
        complete: () => this.categoriesLoading.set(false),
      });
  }

  private loadProducts(overrides: Partial<CatalogQuery> = {}) {
    const value = this.filters.getRawValue();
    const query: CatalogQuery = {
      categoryId: this.selectedCategory() === 'all' ? undefined : this.selectedCategory(),
      page: this.pagination()?.page ?? 1,
      limit: 20,
      hasDiscount: value.dealsOnly ? true : undefined,
      inStock: value.inStockOnly ? true : undefined,
      minPrice: this.toPrice(value.minPrice),
      maxPrice: this.toPrice(value.maxPrice),
      sort: value.sort,
      ...overrides,
    };

    this.loading.set(true);
    this.errorMessage.set(null);

    return this.catalogService.getProducts(query).pipe(
      catchError(() => {
        this.products.set([]);
        this.pagination.set(null);
        this.errorMessage.set('Unable to load products right now.');
        return of(null);
      }),
      map((response) => {
        if (response) {
          this.products.set(response.products ?? []);
          this.pagination.set(response.pagination);
        }
        this.loading.set(false);
        this.restoreHistoryScrollPosition();
        this.restoreQueryScrollPosition();
        return response;
      }),
    );
  }

  private toPrice(value: string | number | null | undefined): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'string' && !value.trim()) {
      return undefined;
    }

    const price = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(price) && price >= 0 ? price : undefined;
  }

  private parsePage(value: string | null): number {
    const page = Number(value);
    return Number.isSafeInteger(page) && page > 0 ? page : 1;
  }

  private parseSort(value: string | null): ProductSort {
    const validSorts: ProductSort[] = [
      'best-match',
      'price-low',
      'price-high',
      'highest-rating',
    ];
    return validSorts.includes(value as ProductSort) ? (value as ProductSort) : 'best-match';
  }

  private getPriceRangeError(
    minValue: string | number | null,
    maxValue: string | number | null,
  ): string | null {
    const minPrice = this.toPrice(minValue);
    const maxPrice = this.toPrice(maxValue);

    if (this.hasPriceValue(minValue) && minPrice === undefined) {
      return 'Enter a valid minimum price of 0 or more.';
    }
    if (this.hasPriceValue(maxValue) && maxPrice === undefined) {
      return 'Enter a valid maximum price of 0 or more.';
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return 'Minimum price cannot be greater than maximum price.';
    }

    return null;
  }

  private hasPriceValue(value: string | number | null): boolean {
    return value !== null && String(value).trim().length > 0;
  }

  private syncListingQuery(overrides: { category?: string; page?: number } = {}): void {
    const value = this.filters.getRawValue();
    const priceError = this.getPriceRangeError(value.minPrice, value.maxPrice);
    if (priceError) {
      this.priceValidationError.set(priceError);
      return;
    }

    this.priceValidationError.set(null);
    const category = overrides.category ?? this.selectedCategory();
    this.pendingQueryScrollPosition = this.viewportScroller.getScrollPosition();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: category === 'all' ? null : category,
        page: overrides.page ?? 1,
        hasDiscount: value.dealsOnly ? true : null,
        inStock: value.inStockOnly ? true : null,
        minPrice: this.hasPriceValue(value.minPrice) ? String(value.minPrice) : null,
        maxPrice: this.hasPriceValue(value.maxPrice) ? String(value.maxPrice) : null,
        sort: value.sort,
      },
      queryParamsHandling: 'merge',
    });
  }

  private restoreHistoryScrollPosition(): void {
    const position = this.pendingHistoryScrollPosition;
    if (!position) return;

    this.pendingHistoryScrollPosition = null;
    requestAnimationFrame(() => this.viewportScroller.scrollToPosition(position));
  }

  private restoreQueryScrollPosition(): void {
    const position = this.pendingQueryScrollPosition;
    if (!position) return;

    this.pendingQueryScrollPosition = null;
    requestAnimationFrame(() => this.viewportScroller.scrollToPosition(position));
  }

  sortOpen = false;

  selectSort(value: ProductSort): void {
    this.filters.controls.sort.setValue(value);
    this.sortOpen = false;
  }
}
