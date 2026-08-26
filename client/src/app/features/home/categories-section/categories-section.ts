import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { CatalogCategory } from '../../../shared/models/catalog';

@Component({
  selector: 'app-categories-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './categories-section.html',
})
export class CategoriesSectionComponent {
  @Input() categories: CatalogCategory[] = [];
  @Input() loading = false;
}
