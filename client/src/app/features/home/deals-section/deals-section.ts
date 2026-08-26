import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import type { CatalogProduct } from '../../../shared/models/catalog';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';

@Component({
  selector: 'app-deals-section',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './deals-section.html',
})
export class DealsSectionComponent {
  @Input() products: CatalogProduct[] = [];
  @Input() loading = false;
}
