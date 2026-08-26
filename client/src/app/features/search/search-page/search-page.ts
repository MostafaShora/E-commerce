import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import type { CatalogProduct, CatalogProductsPagination, ProductSort } from '../../../shared/models/catalog';
import { CatalogService } from '../../products/services/catalog';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ProductCardComponent],
  templateUrl: './search-page.html',
})
export class SearchPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly query = signal('');
  readonly products = signal<CatalogProduct[]>([]);
  readonly pagination = signal<CatalogProductsPagination | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly searchForm = new FormGroup({
    query: new FormControl('', { nonNullable: true }),
  });
  readonly sort = new FormControl<ProductSort>('best-match', { nonNullable: true });

  constructor() {
    this.route.queryParamMap.pipe(
      map((params) => (params.get('q') ?? '').trim()),
      distinctUntilChanged(),
      switchMap((query) => {
        this.query.set(query);
        this.searchForm.controls.query.setValue(query, { emitEvent: false });
        return this.loadResults(query, 1);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.sort.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.query()) this.loadResults(this.query(), 1).subscribe();
    });
  }

  submitSearch(): void {
    const query = this.searchForm.controls.query.value.trim();
    void this.router.navigate(['/search-results'], { queryParams: query ? { q: query } : {} });
  }

  goToPage(page: number): void {
    const current = this.pagination();
    if (!current || page < 1 || page > current.totalPages || page === current.page) return;
    this.loadResults(this.query(), page).subscribe();
  }

  retry(): void {
    if (this.query()) this.loadResults(this.query(), this.pagination()?.page ?? 1).subscribe();
  }

  private loadResults(query: string, page: number) {
    if (!query) {
      this.products.set([]);
      this.pagination.set(null);
      this.errorMessage.set(null);
      this.loading.set(false);
      return of(null);
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    return this.catalogService.getProducts({ keyword: query, sort: this.sort.value, page, limit: 20 }).pipe(
      catchError(() => {
        this.products.set([]);
        this.pagination.set(null);
        this.errorMessage.set('Unable to search products right now.');
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
}
