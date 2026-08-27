import { Component } from '@angular/core';

import { CategoriesSectionComponent } from '../categories-section/categories-section';
import { DealsSectionComponent } from '../deals-section/deals-section';
import { HeroCarouselComponent } from '../hero-carousel/hero-carousel';
import { ProductSectionsComponent } from '../product-sections/product-sections';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    HeroCarouselComponent,
    CategoriesSectionComponent,
    DealsSectionComponent,
    ProductSectionsComponent,
  ],
  templateUrl: './home-page.html',
})
export class HomePageComponent {}
