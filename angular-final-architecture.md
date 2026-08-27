# Angular Final Architecture — MERN AI E-Commerce Migration

## 1. الهدف

هذا الملف هو الـ final architecture المقترحة لتحويل React/Vite frontend الحالي إلى Angular 22.

React هو مصدر الحقيقة للـ UI/UX والـ routes والـ API behavior والـ business workflows، لكن Angular لا يجب أن ينسخ structure React حرفيًا.

الـ stack المقترح:
- Angular 22 Standalone Components
- Angular Router
- HttpClient
- Signals + computed
- RxJS
- Reactive Forms
- Angular CDK عند الحاجة
- Tailwind CSS
- Lucide Angular
- Cookie-based authentication
- بدون NgModules
- بدون NgRx حاليًا
- بدون Angular Query حاليًا

---

## 2. Final Angular Architecture

```text
client/
├── public/
│   └── assets/
│       ├── cats-img/
│       ├── images/
│       ├── product-imgs/
│       ├── hero.png
│       └── logo.png
│
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── api/
│   │   │   │   ├── api-error.ts
│   │   │   │   └── api-response.ts
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.state.ts
│   │   │   │   └── auth.models.ts
│   │   │   │
│   │   │   ├── cart/
│   │   │   │   ├── cart.ts
│   │   │   │   ├── cart-storage.ts
│   │   │   │   └── cart.models.ts
│   │   │   │
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── admin.guard.ts
│   │   │   │
│   │   │   ├── interceptors/
│   │   │   │   ├── credentials-interceptor.ts
│   │   │   │   └── api-error-interceptor.ts
│   │   │   │
│   │   │   └── services/
│   │   │       ├── notification.ts
│   │   │       └── theme.ts
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── auth-page/
│   │   │   ├── login-form/
│   │   │   └── register-form/
│   │   │
│   │   │   ├── home/
│   │   │   │   ├── home-page/
│   │   │   │   ├── hero-carousel/
│   │   │   │   ├── categories-section/
│   │   │   │   ├── deals-section/
│   │   │   │   ├── product-sections/
│   │   │   │   ├── models/
│   │   │   │   └── services/
│   │   │
│   │   │   ├── products/
│   │   │   │   ├── products-page/
│   │   │   │   ├── models/
│   │   │   │   └── services/
│   │   │   │       ├── product.service.ts
│   │   │   │       └── catalog.service.ts
│   │   │
│   │   │   ├── search/
│   │   │   │   └── search-page/
│   │   │
│   │   │   ├── product-detail/
│   │   │   │   ├── product-detail-page/
│   │   │   │   ├── models/
│   │   │   │   └── services/
│   │   │
│   │   │   ├── cart/
│   │   │   │   └── cart-page/
│   │   │
│   │   │   ├── checkout/
│   │   │   │   ├── checkout-page/
│   │   │   │   ├── components/
│   │   │   │   │   ├── address-section/
│   │   │   │   │   ├── payment-section/
│   │   │   │   │   ├── order-summary/
│   │   │   │   │   └── review-section/
│   │   │   │   ├── models/
│   │   │   │   └── services/
│   │   │   │       └── order.service.ts
│   │   │
│   │   │   ├── addresses/
│   │   │   │   ├── addresses-page/
│   │   │   │   ├── models/
│   │   │   │   └── services/
│   │   │   │       └── address.service.ts
│   │   │
│   │   │   ├── orders/
│   │   │   │   ├── orders-page/
│   │   │   │   ├── order-detail-page/
│   │   │   │   ├── components/
│   │   │   │   │   └── order-tracking/
│   │   │   │   ├── models/
│   │   │   │   └── services/
│   │   │   │       └── order.service.ts
│   │   │
│   │   │   ├── reviews/
│   │   │   │   ├── account-reviews/
│   │   │   ├── models/
│   │   │   └── services/
│   │   │       └── review.service.ts
│   │   │
│   │   │   └── admin/
│   │   │       ├── models/
│   │   │       │   └── admin.model.ts
│   │   │       ├── services/
│   │   │       │   └── admin.service.ts
│   │   │       ├── dashboard/
│   │   │       ├── categories/
│   │   │       ├── orders/
│   │   │       ├── products/
│   │   │       └── new-product/
│   │   │           ├── new-product.ts
│   │   │           ├── new-product.html
│   │   │           ├── new-product.css
│   │   │           └── components/
│   │   │               └── product-image-uploader/
│   │
│   │   ├── layouts/
│   │   │   ├── storefront-layout/
│   │   │   │   ├── storefront-layout.ts
│   │   │   │   ├── storefront-layout.html
│   │   │   │   ├── storefront-layout.css
│   │   │   │   └── components/
│   │   │   │       ├── banner/
│   │   │   │       ├── nav/
│   │   │   │       └── footer/
│   │   │   ├── account-layout/
│   │   │   └── admin-layout/
│   │   │
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── product-card/
│   │   │   │   ├── logo/
│   │   │   │   ├── cart-button/
│   │   │   │   ├── cart-drawer/
│   │   │   │   ├── star-rating/
│   │   │   │   ├── order-status-badge/
│   │   │   │   ├── empty-state/
│   │   │   │   ├── price-display/
│   │   │   │   └── loading-skeleton/
│   │   │   ├── ui/
│   │   │   │   ├── button/
│   │   │   │   ├── dialog/
│   │   │   │   ├── drawer/
│   │   │   │   ├── input/
│   │   │   │   ├── select/
│   │   │   │   ├── pagination/
│   │   │   │   ├── table/
│   │   │   │   └── ...
│   │   │   ├── models/
│   │   │   └── utils/
│   │   │
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── app.ts
│   │   └── app.html
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── main.ts
│   ├── index.html
│   ├── styles.css
│   └── material-theme.scss
│
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. React → Angular Mapping

### Entry points

| React | Angular |
|---|---|
| `main.tsx` | `src/main.ts` |
| `App.tsx` | `src/app/app.ts` + `app.html` |
| `index.css` | `src/styles.css` |
| `vite.config.ts` | Angular CLI/build configuration |

### Routes

| React | Angular |
|---|---|
| `routes/index.tsx` | `app.routes.ts` |
| `routes/route.ts` | `app.routes.ts` |
| `routes/protected-guard.tsx` | `core/guards/auth.guard.ts` |
| Admin protection | `core/guards/admin.guard.ts` |

### Layouts

| React | Angular |
|---|---|
| `layouts/app-layout.tsx` | `layouts/storefront-layout/` |
| `layouts/account-layout.tsx` | `layouts/account-layout/` |
| `layouts/admin-layout.tsx` | `layouts/admin-layout/` |

### Storefront components

| React | Angular |
|---|---|
| `components/banner.tsx` | `layouts/storefront-layout/components/banner/` |
| `components/nav.tsx` | `layouts/storefront-layout/components/nav/` |
| `components/footer.tsx` | `layouts/storefront-layout/components/footer/` |
| `components/logo.tsx` | `shared/components/logo/` |
| `components/cart-button.tsx` | `shared/components/cart-button/` |
| `components/cart-sheet.tsx` | `shared/components/cart-drawer/` |
| `components/mode-toggle.tsx` | `shared/components/mode-toggle/` |
| `components/theme-provider.tsx` | `core/services/theme.ts` |

### Pages/features

| React | Angular |
|---|---|
| `pages/home/index.tsx` | `features/home/home-page/` |
| `pages/home/hero-carousel.tsx` | `features/home/hero-carousel/` |
| `pages/home/categories-section.tsx` | `features/home/categories-section/` |
| `pages/home/deals-section.tsx` | `features/home/deals-section/` |
| `pages/home/product-sections.tsx` | `features/home/product-sections/` |
| `pages/products/index.tsx` | `features/products/products-page/` |
| `pages/search-results/index.tsx` | `features/search/search-page/` |
| `pages/product-detail/index.tsx` | `features/product-detail/product-detail-page/` |
| `pages/checkout/index.tsx` | `features/checkout/checkout-page/` |
| `pages/checkout/components/address-section.tsx` | `features/checkout/components/address-section/` |
| `pages/checkout/components/payment-section.tsx` | `features/checkout/components/payment-section/` |
| `pages/checkout/components/order-summary.tsx` | `features/checkout/components/order-summary/` |
| `pages/checkout/components/review-section.tsx` | `features/checkout/components/review-section/` |
| `pages/account/addresses.tsx` | `features/addresses/addresses-page/` |
| `pages/account/reviews.tsx` | `features/reviews/account-reviews/` |
| `pages/orders/orders.tsx` | `features/orders/orders-page/` |
| `pages/orders/components/order-tracking.tsx` | `features/orders/components/order-tracking/` |
| `pages/admin/dashboard.tsx` | `features/admin/dashboard/` |
| `pages/admin/orders.tsx` | `features/admin/orders/` |
| `pages/admin/products.tsx` | `features/admin/products/` |
| `pages/admin/new-product.tsx` | `features/admin/new-product/` |
| `pages/admin/components/product-image-uploader.tsx` | `features/admin/new-product/components/product-image-uploader/` |
| `pages/not-found/index.tsx` | `features/not-found/` |

---

## 4. Hooks → Angular

| React | Angular |
|---|---|
| `useState` | `signal()` |
| `useEffect` | `effect()`, lifecycle hooks, or RxJS |
| `useMemo` | `computed()` |
| `useCallback` | Normal class method |
| React Context | Injectable service |
| Zustand | Injectable signal store/service |
| React Query | HttpClient + RxJS + signals/resources |
| React Hook Form | Reactive Forms |
| Zod | Angular validators / typed validation |
| Axios | HttpClient |

Specific mappings:

```text
use-auth.ts
→ core/auth/auth.service.ts + auth.state.ts

use-user.ts
→ core/auth/auth.service.ts / auth.state.ts

use-cart.ts
→ core/cart/cart.ts

use-debounce.ts
→ RxJS debounceTime()

use-mobile.ts
→ Angular CDK/media query approach or local responsive logic
```

---

## 5. Core Responsibilities

`core/` contains application-wide infrastructure and state.

### Auth

```text
core/auth/
├── auth.service.ts
├── auth.state.ts
└── auth.models.ts
```

Owns:
- login
- register
- logout
- current user
- authentication status

Authentication remains cookie-based.

Use `withCredentials: true`.

Never store HTTP-only auth tokens in localStorage.

### Cart

```text
core/cart/
├── cart.ts
├── cart-storage.ts
└── cart.models.ts
```

Cart is global state.

Recommended signals:

```text
items
subtotal
deliveryFee
tax
orderTotal
cartCount
isLoading
isOpen
```

Cart synchronization:

```text
user action
→ optimistic update
→ snapshot
→ debounceTime(500)
→ POST /api/cart
→ authoritative server response
→ rollback on failure
```

Persist only a temporary item snapshot.

Never trust persisted prices, stock, tax, delivery, or totals.

### Guards

```text
core/guards/
├── auth.guard.ts
└── admin.guard.ts
```

`authGuard` protects checkout/account/order routes.

`adminGuard` verifies authenticated admin access.

### Interceptors

```text
core/interceptors/
├── credentials-interceptor.ts
└── api-error-interceptor.ts
```

Credentials interceptor:
- sends credentials for API requests

Error interceptor:
- normalizes API errors

### Global services

```text
core/services/
├── notification.ts
└── theme.ts
```

---

## 6. Features

Every business domain belongs under `features/`.

### Home

```text
features/home/
├── home-page/
├── hero-carousel/
├── categories-section/
├── deals-section/
├── product-sections/
├── models/
└── services/
```

The page composes sections.

### Products

```text
features/products/
├── products-page/
├── models/
└── services/
    ├── product.service.ts
    └── catalog.service.ts
```

Use Angular Router query parameters for:
- category
- keyword
- sorting
- prices
- stock
- pagination

### Search

```text
features/search/
└── search-page/
```

Search query should be synchronized with URL query parameters.

### Product Detail

```text
features/product-detail/
├── product-detail-page/
├── models/
└── services/
```

Product slug comes from route params.

### Cart

```text
features/cart/
└── cart-page/
```

The actual global cart state remains in `core/cart`.

### Checkout

```text
features/checkout/
├── checkout-page/
├── components/
│   ├── address-section/
│   ├── payment-section/
│   ├── order-summary/
│   └── review-section/
├── models/
└── services/
    └── order.service.ts
```

Use Reactive Forms.

The current backend returns a Stripe checkout URL, so Stripe.js is not required for the current flow.

### Addresses

```text
features/addresses/
├── addresses-page/
├── models/
└── services/
    └── address.service.ts
```

### Orders

```text
features/orders/
├── orders-page/
├── order-detail-page/
├── components/
│   └── order-tracking/
├── models/
└── services/
    └── order.service.ts
```

### Reviews

```text
features/reviews/
├── account-reviews/
├── models/
└── services/
    └── review.service.ts
```

Avoid `any`.

### Admin

```text
features/admin/
├── models/
│   └── admin.model.ts
├── services/
│   └── admin.service.ts
├── dashboard/
├── categories/
├── orders/
├── products/
└── new-product/
    └── components/
        └── product-image-uploader/
```

Admin should be lazy-loaded and protected by `adminGuard`.

---

## 7. Layout Responsibilities

### Storefront Layout

```text
layouts/storefront-layout/
├── storefront-layout.ts
├── storefront-layout.html
├── storefront-layout.css
└── components/
    ├── banner/
    ├── nav/
    └── footer/
```

Structural responsibility:

```text
Banner
Nav
Router Outlet
Footer
```

It should not contain business logic.

### Account Layout

Used for authenticated account pages.

### Admin Layout

Used for admin dashboard routes.

Authorization belongs to `adminGuard`, not only the layout.

---

## 8. Shared Responsibilities

`shared/` contains genuinely reusable UI.

```text
shared/
├── components/
│   ├── product-card/
│   ├── logo/
│   ├── cart-button/
│   ├── cart-drawer/
│   ├── star-rating/
│   ├── order-status-badge/
│   ├── empty-state/
│   ├── price-display/
│   └── loading-skeleton/
│
├── ui/
│   ├── button/
│   ├── dialog/
│   ├── drawer/
│   ├── input/
│   ├── select/
│   ├── pagination/
│   ├── table/
│   └── ...
│
├── models/
└── utils/
```

Do not copy all React shadcn/Radix components automatically.

Create only the reusable Angular UI actually required.

Use Angular CDK for accessible overlay/dialog/focus/drag-drop behavior when appropriate.

---

## 9. Models

The React types:

```text
types/
├── admin.type.ts
├── auth.type.ts
├── cart.type.ts
├── categories.type.ts
├── order.type.ts
├── products.type.ts
└── review.type.ts
```

should become typed Angular models distributed by domain.

Examples:

```text
AuthUser
LoginInput
RegisterInput

Address
CreateAddressInput

Category

Product
ProductQuery

CartItem
Cart

Order
OrderItem
CreateOrderInput
CreateOrderResponse

Review
ReviewableOrder
UserReview

AdminAnalytics
AdminOrder
CreateProductInput
UpdateOrderStatusInput
AiGenerationInput
```

Prefer feature-local models:

```text
features/products/models/
features/orders/models/
features/reviews/models/
features/admin/models/
```

Global/shared models should only be truly shared.

---

## 10. Constants and Utils

Do not create global folders just to mirror React.

React:

```text
constants/
├── address.ts
├── checkout.ts
└── orders.ts
```

Angular should keep constants close to the domain:

```text
features/checkout/constants/
features/addresses/constants/
features/orders/constants/
```

Generic helpers:

```text
shared/utils/
```

Domain-specific helpers:

```text
features/orders/utils/
```

---

## 11. API Architecture

React:

```text
lib/
├── api.ts
├── axios-client.ts
├── env.ts
└── utils.ts
```

Angular:

```text
core/api/
├── api-error.ts
└── api-response.ts

core/interceptors/
├── credentials-interceptor.ts
└── api-error-interceptor.ts

environments/
├── environment.ts
└── environment.prod.ts
```

Use typed feature services instead of one giant API service.

---

## 12. API Endpoint Map

```text
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/status

GET  /api/categories

GET  /api/products
GET  /api/products/deals
GET  /api/products/:slug
GET  /api/products/:slug/reviews

GET  /api/cart
POST /api/cart

GET  /api/addresses
POST /api/addresses

POST /api/orders
GET  /api/orders
GET  /api/orders/:orderId

GET  /api/reviews/reviewable
GET  /api/reviews
POST /api/reviews

GET  /api/admin/analytics
GET  /api/admin/orders
PUT  /api/admin/orders/:id/status
GET  /api/admin/products
POST /api/admin/products
POST /api/admin/products/upload
POST /api/admin/ai/generate
```

The actual Express backend is the source of truth for exact request/response shapes.

---

## 13. Routing

```text
/
├── Storefront Layout
│   ├── /
│   ├── /products
│   ├── /products/:slug
│   ├── /search-results
│   └── /checkout              authGuard
│
├── Account Layout             authGuard
│   ├── /orders
│   ├── /orders/:orderId
│   ├── /account/reviews
│   └── /account/addresses
│
└── Admin Layout               adminGuard
    ├── /admin
    ├── /admin/categories
    ├── /admin/orders
    ├── /admin/products
    └── /admin/products/new
```

Unknown routes → not-found component.

Use lazy loading for admin and major feature areas.

---

## 14. State Management Strategy

### Global state

```text
Auth
Cart
Theme
Global UI state
```

Use injectable services/stores with signals.

### Server state

```text
Products
Categories
Addresses
Orders
Reviews
Admin data
```

Use typed HttpClient services + RxJS + signals/resources.

### Local state

```text
Dialog state
Selected tab
Temporary filters
Accordion state
Form state
```

Use local signals or Reactive Forms.

Do not introduce NgRx initially.

---

## 15. Final React → Angular Responsibility Rules

```text
React components
→ Angular components

React pages
→ Angular feature pages

React layouts
→ Angular layouts

React hooks
→ Angular services / signal stores / RxJS

React Zustand
→ Injectable signal store

React Context
→ Injectable service

React Axios
→ HttpClient

React Query
→ Typed service + RxJS/signals/resources

React Hook Form
→ Reactive Forms

React types
→ Angular models/interfaces

React constants
→ Feature-local constants

React utils
→ shared or feature-local utils

React routes
→ Angular Router

React protected guard
→ Angular authGuard

React admin check
→ Angular adminGuard

React theme provider
→ ThemeService
```

---

## 16. Migration Order

```text
1. Angular foundation
2. Environment/API configuration
3. HttpClient + interceptors
4. Auth
5. Guards
6. Storefront layout
7. Shared UI
8. Home
9. Products
10. Search
11. Product Detail
12. Cart
13. Addresses
14. Checkout
15. Orders
16. Reviews
17. Admin
18. Tests
19. Production deployment
```

---

## 17. Important Migration Risks

- React authentication guard is currently partially stubbed.
- Admin protection should be implemented through Angular `adminGuard`.
- Cart local persistence can contain stale data.
- Backend must remain authoritative for prices, stock, tax, delivery, and totals.
- Cart synchronization needs optimistic update + rollback.
- Some React APIs use `any`; Angular should use explicit types.
- Product/search filters mix URL state and local state; Angular should prefer URL state for shareable filters.
- Checkout currently redirects to a Stripe URL returned by backend.
- Theme logic should be centralized.
- Radix/shadcn interaction behavior must remain accessible.
- The actual backend in the workspace is Express, not NestJS.

---

## 18. Final Architecture Principle

```text
CORE
Application-wide infrastructure and state

FEATURES
Business domains and workflows

LAYOUTS
Page shells and structural composition

SHARED
Reusable UI, components, models and utilities
```

The final Angular application should therefore be organized as:

```text
app/
├── core/
├── features/
├── layouts/
└── shared/
```

The React project defines WHAT the application does.

The Angular architecture defines HOW that behavior is organized in Angular.

Do not create files merely to make Angular visually resemble React. Create files according to responsibility, reuse, and business domain.
