import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';

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
  imports: [CommonModule, ReactiveFormsModule, ProductCardComponent],
  templateUrl: './products-page.html',
})
export class ProductsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
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

  constructor() {
    this.loadCategories();
    this.route.queryParamMap
      .pipe(
        map((params) => params.get('category') ?? 'all'),
        distinctUntilChanged(),
        switchMap((category) => {
          this.selectedCategory.set(category);
          this.currentCategoryName.set(
            this.categories().find((item) => item._id === category)?.name ??
              (category === 'all' ? 'All' : 'Category'),
          );
          return this.loadProducts({
            categoryId: category === 'all' ? undefined : category,
            page: 1,
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.filters.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadProducts({ page: 1 }));
  }

  applyPriceFilter(): void {
    this.filters.patchValue({
      minPrice: this.priceInputs.controls.min.value,
      maxPrice: this.priceInputs.controls.max.value,
    });
  }

  selectCategory(category: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: category === 'all' ? {} : { category },
      queryParamsHandling: '',
    });
  }

  resetFilters(): void {
    this.priceInputs.reset();
    this.filters.reset({
      dealsOnly: false,
      inStockOnly: false,
      minPrice: '',
      maxPrice: '',
      sort: 'best-match',
    });
  }

  goToPage(page: number): void {
    const current = this.pagination();
    if (!current || page < 1 || page > current.totalPages || page === current.page) {
      return;
    }

    this.loadProducts({ page }).subscribe();
  }

  retryProducts(): void {
    this.loadProducts().subscribe();
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
        return response;
      }),
    );
  }

  private toPrice(value: string): number | undefined {
    if (!value.trim()) {
      return undefined;
    }

    const price = Number(value);
    return Number.isFinite(price) && price >= 0 ? price : undefined;
  }
}
