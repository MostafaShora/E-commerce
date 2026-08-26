import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, RouterOutlet],
  templateUrl: './storefront-layout.html',
})
export class StorefrontLayout {
  readonly searchForm = new FormGroup({
    query: new FormControl('', { nonNullable: true }),
  });

  constructor(private readonly router: Router) {}

  submitSearch(): void {
    const query = this.searchForm.controls.query.value.trim();
    void this.router.navigate(['/search-results'], {
      queryParams: query ? { q: query } : {},
    });
  }
}
