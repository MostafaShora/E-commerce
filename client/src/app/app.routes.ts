import { Routes } from '@angular/router';

import { AuthPageComponent } from './features/auth/auth-page';
import { authGuard } from './core/guards/auth-guard';
import { HomePageComponent } from './features/home/home-page/home-page';
import { StorefrontLayout } from './layouts/storefront-layout/storefront-layout';

const productsPlaceholder = () =>
  import('./features/products/products-page/products-page').then(
    (m) => m.ProductsPage,
  );

const productDetailPlaceholder = () =>
  import('./features/product-detail/product-detail-page/product-detail-page').then(
    (m) => m.ProductDetailPage,
  );

export const routes: Routes = [
  {
    path: '',
    component: StorefrontLayout,
    children: [
      {
        path: '',
        component: HomePageComponent,
      },
      {
        path: 'products',
        loadComponent: productsPlaceholder,
      },
      {
        path: 'products/:slug',
        loadComponent: productDetailPlaceholder,
      },
    ],
  },
  {
    path: 'auth',
    component: AuthPageComponent,
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/account-placeholder').then(
        (m) => m.AccountPlaceholderComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
