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

const searchPage = () =>
  import('./features/search/search-page/search-page').then(
    (m) => m.SearchPage,
  );

const cartPage = () =>
  import('./features/cart/cart-page/cart-page').then(
    (m) => m.CartPageComponent,
  );

const addressesPage = () =>
  import('./features/addresses/addresses-page/addresses-page').then(
    (m) => m.AddressesPageComponent,
  );

const checkoutPage = () =>
  import('./features/checkout/checkout-page/checkout-page').then(
    (m) => m.CheckoutPageComponent,
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
      {
        path: 'search-results',
        loadComponent: searchPage,
      },
      {
        path: 'cart',
        loadComponent: cartPage,
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: checkoutPage,
      },
    ],
  },
  {
    path: 'auth',
    component: AuthPageComponent,
  },
  {
    path: 'account/addresses',
    canActivate: [authGuard],
    loadComponent: addressesPage,
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
