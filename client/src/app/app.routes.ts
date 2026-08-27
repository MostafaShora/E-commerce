import { Routes } from '@angular/router';

import { AuthPageComponent } from './features/auth/auth-page/auth-page';
import { authGuard } from './core/guards/auth-guard';
import { HomePageComponent } from './features/home/home-page/home-page';
import { StorefrontLayout } from './layouts/storefront-layout/storefront-layout';
import { adminGuard } from './core/guards/admin-guard';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { AccountLayout } from './layouts/account-layout/account-layout';
import { NotFoundComponent } from './features/not-found/not-found';

const productsPlaceholder = () =>
  import('./features/products/products-page/products-page').then((m) => m.ProductsPage);

const productDetailPlaceholder = () =>
  import('./features/product-detail/product-detail-page/product-detail-page').then(
    (m) => m.ProductDetailPage,
  );

const searchPage = () =>
  import('./features/search/search-page/search-page').then((m) => m.SearchPage);

const cartPage = () =>
  import('./features/cart/cart-page/cart-page').then((m) => m.CartPageComponent);

const addressesPage = () =>
  import('./features/addresses/addresses-page/addresses-page').then(
    (m) => m.AddressesPageComponent,
  );

const accountPage = () =>
  import('./features/account/account-page/account-page').then(
    (m) => m.AccountPageComponent,
  );

const checkoutPage = () =>
  import('./features/checkout/checkout-page/checkout-page').then((m) => m.CheckoutPageComponent);

const ordersPage = () =>
  import('./features/orders/orders-page/orders-page').then((m) => m.OrdersPageComponent);

const orderDetailPage = () =>
  import('./features/orders/order-detail-page/order-detail-page').then(
    (m) => m.OrderDetailPageComponent,
  );

const reviewsPage = () =>
  import('./features/reviews/account-reviews/account-reviews').then(
    (m) => m.AccountReviewsPageComponent,
  );

export const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/products/products').then((m) => m.AdminProductsComponent),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/admin/new-product/new-product').then(
            (m) => m.AdminNewProductComponent,
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/categories/categories').then((m) => m.AdminCategoriesComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/orders/orders').then((m) => m.AdminOrdersComponent),
      },
    ],
  },
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
      {
        path: 'account',
        component: AccountLayout,
        canActivate: [authGuard],
        children: [
          { path: '', pathMatch: 'full', loadComponent: accountPage },
          { path: 'orders', loadComponent: ordersPage },
          { path: 'orders/:id', loadComponent: orderDetailPage },
          { path: 'reviews', loadComponent: reviewsPage },
          { path: 'addresses', loadComponent: addressesPage },
        ],
      },
    ],
  },
  {
    path: 'auth',
    component: AuthPageComponent,
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
