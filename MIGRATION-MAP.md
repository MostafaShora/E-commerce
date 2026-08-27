# React -> Angular Migration Map

> Analysis-only snapshot generated from the current workspace on 2026-08-27. No existing source file was changed for this report.

## 1. Projects

| Project          | Actual path                                               | Role                          | Evidence                                                                                 |
| ---------------- | --------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| React frontend   | `D:/Project Mean Stack/MERN-AI-Ecommerce-Platform/client` | Current UI/behavior reference | Vite React app with `src/main.tsx`, `src/App.tsx`, React Router, TanStack Query, Zustand |
| Angular frontend | `D:/Project Mean Stack/E-commerce/client`                 | Migration target              | Angular 22 application with `src/main.ts`, standalone components, `app.routes.ts`        |
| NestJS backend   | `D:/Project Mean Stack/E-commerce/backend`                | Backend contract authority    | Nest controllers, DTOs, guards, Mongoose schemas and services                            |

The workspace does not contain a `client-angular` directory. The migration target is the `E-commerce/client` project.

### Inventory counts

- React source files under `client/src`: **124**
- Angular files under `client/src/app`: **131**
- React TypeScript/TSX files: **101**
- Angular app TypeScript/template/style files: **131**
- These counts include source tests, assets, and current worktree files. They do not treat generated `dist` or `.angular` cache files as source.

### Current worktree note

The Angular worktree contains existing changes from previous migration work and formatter/reorganization activity, including auth files moved into folders, Material configuration, new tests and styles, and an edited `app.routes.ts`. Those changes were preserved and are described as current-state evidence, not as part of this report's implementation.

## 2. React Architecture

### Entry and providers

- `src/main.tsx` creates the React root and composes `StrictMode`, `QueryClientProvider`, `ThemeProvider`, `TooltipProvider`, and `Toaster`.
- `src/App.tsx` delegates to `RouterProvider`.
- `src/routes/index.tsx` defines the nested route tree and `ScrollRestoration`.
- `src/lib/axios-client.ts` creates an Axios client with `baseURL`, `withCredentials: true`, timeout, and response error normalization.
- `src/lib/env.ts` supplies the API base URL.
- Server state is TanStack Query; local state is Zustand; forms are React Hook Form plus Zod; UI primitives are shadcn/Radix; icons are Lucide.

### React dependency flow

| React surface                    | Direct dependencies                                                                                       | Behavior                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `pages/product-detail/index.tsx` | `components/product-card.tsx`, `hooks/use-cart.ts`, `lib/api.ts`, `utils/helper.ts`, product/review types | Loads detail and reviews, reads cart state, adds/updates/removes cart items, renders related products and review UI |
| `pages/checkout/index.tsx`       | `hooks/use-cart.ts`, `lib/api.ts`, checkout child components, address constants                           | Reads persistent cart, loads addresses, creates addresses/orders, redirects to Stripe, clears cart after COD        |
| `pages/account/reviews.tsx`      | `lib/api.ts`, React Query, Tabs/Card/Textarea/Skeleton UI, review types                                   | Loads reviewable items and submitted reviews, submits one review per order item                                     |
| `pages/admin/new-product.tsx`    | `lib/api.ts`, `components/ui/*`, `pages/admin/components/product-image-uploader.tsx`, Zod                 | Loads categories, uploads images, generates AI copy, validates and creates a product                                |
| `layouts/app-layout.tsx`         | `banner`, `nav`, `footer`, `cart-sheet`, `auth-dialog`, `use-user`, `use-cart`                            | Global storefront shell and cart synchronization after user load                                                    |
| `layouts/account-layout.tsx`     | React Router, Lucide icons, shared Button/Separator                                                       | Account sidebar and nested outlet                                                                                   |
| `layouts/admin-layout.tsx`       | Sidebar primitives, `useAuth`/API logout, React Router                                                    | Admin sidebar, header, admin check, logout and nested outlet                                                        |

## 3. Angular Architecture

### Current Angular structure

- `src/app/app.ts`, `app.html`, `app.css`: root shell and root outlet.
- `src/app/app.config.ts`: `provideHttpClient` with credentials and API-error interceptors, and `provideRouter`.
- `src/app/app.routes.ts`: standalone lazy routes for storefront, account, and admin surfaces.
- `src/app/core/`: auth, cart, API error normalization, guards, interceptors, and placeholder theme/notification services.
- `src/app/features/`: domain pages and services grouped by addresses, admin, auth, cart, checkout, home, orders, product detail, products, reviews, and search.
- `src/app/layouts/`: account, admin, and storefront layouts.
- `src/app/shared/components/product-card/`: reusable product card.
- `src/app/shared/models/catalog.ts`: catalog/category/product/pagination interfaces.
- Forms use Angular Reactive Forms. HTTP uses `HttpClient`. State uses signals and RxJS.

### Architecture differences

- React's one `components/ui` directory contains many presentation primitives. Angular currently has only the product card as a shared component and uses inline/page templates for most UI.
- React has a global app shell with banner, nav, footer, cart sheet and auth dialog. Angular currently has a storefront header/outlet but no equivalent banner, footer, cart drawer or global auth dialog.
- Angular has domain services with server-shaped types rather than a TanStack Query cache.
- Angular's current cart service is server-backed but does not yet reproduce React's persisted local cart, debounce, optimistic rollback and toast behavior.
- Angular has an account layout and admin layout, but some current templates are simpler than their React references.

## 4. Folder Mapping

| React folder                           | Angular folder                                                                | Status           | Notes                                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `client/src/components`                | `client/src/app/shared/components`, `client/src/app/layouts`, feature folders | `REQUIRES_SPLIT` | React mixes global shell, domain components and UI primitives; Angular correctly separates them by ownership |
| `client/src/components/ui`             | No single equivalent; page templates, Angular Material, `shared/components`   | `REQUIRES_SPLIT` | Only reusable cross-domain pieces should become shared Angular components                                    |
| `client/src/pages`                     | `client/src/app/features`                                                     | `REQUIRES_SPLIT` | Each React page generally maps to a standalone Angular page plus a service and possibly child components     |
| `client/src/pages/checkout/components` | `features/checkout/checkout-page` and currently inline checkout template      | `PARTIAL`        | Address/payment/review/order-summary responsibilities are not fully split in Angular                         |
| `client/src/pages/orders/components`   | `features/orders/order-detail-page`                                           | `PARTIAL`        | Delivery timeline and sidebar are currently folded into one Angular page template                            |
| `client/src/pages/admin/components`    | `features/admin/new-product`                                                  | `PARTIAL`        | Image uploader is not equivalent because NestJS supports one file on product creation                        |
| `client/src/hooks`                     | `core/auth`, `core/cart`, feature services, signals and RxJS                  | `REQUIRES_SPLIT` | Hook responsibilities are distributed by Angular ownership rules                                             |
| `client/src/lib`                       | `core`, feature services, shared models/utilities                             | `REQUIRES_SPLIT` | Axios/API/env/utils map to separate Angular concerns                                                         |
| `client/src/types`                     | `shared/models/catalog`, feature service type declarations                    | `REQUIRES_SPLIT` | Types are currently distributed rather than centralized                                                      |
| `client/src/constants`                 | Feature constants and TypeScript unions                                       | `PARTIAL`        | Some constants exist in types/services; no complete shared constants layer                                   |
| `client/src/utils`                     | No complete equivalent; page/service helpers                                  | `PARTIAL`        | Price/status/date helpers are repeated in several Angular components                                         |
| `client/src/assets`                    | `client/public` and CSS/theme configuration                                   | `NOT_STARTED`    | React assets have not been comprehensively copied or registered in Angular                                   |

## 5. File-by-File Mapping

The table below maps the important source files and groups repeated UI primitives where a one-to-one file mapping would be misleading.

### Entry, routing and layouts

| React file                       | React responsibility                                           | Angular equivalent                                                   | Angular responsibility                                    | Status           | Notes                                                                                                    |
| -------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| `src/main.tsx`                   | Providers, root render, theme, tooltip, toaster                | `client/src/main.ts`, `client/src/app/app.config.ts`                 | Angular bootstrap/providers                               | `REQUIRES_SPLIT` | Query provider/toaster/tooltip do not have direct global equivalents                                     |
| `src/App.tsx`                    | Router provider                                                | `client/src/app/app.ts`, `client/src/app/app.html`                   | Root component and outlet                                 | `MATCHED`        | Both delegate rendering to routing                                                                       |
| `src/routes/index.tsx`           | Nested Root/App/Protected/Account/Admin route tree             | `client/src/app/app.routes.ts`                                       | Standalone lazy route tree                                | `PARTIAL`        | Angular route tree exists, but paths differ and not-found is redirect-to-home                            |
| `src/routes/route.ts`            | Route constants and page registry                              | `client/src/app/app.routes.ts`                                       | Route definitions and lazy imports                        | `REQUIRES_MERGE` | Angular has no separate route constants registry                                                         |
| `src/routes/protected-guard.tsx` | User check, auth modal opening, redirect                       | `client/src/app/core/guards/auth-guard.ts`                           | Calls `/api/auth/status`, redirects unauthenticated users | `PARTIAL`        | Angular guard is more authoritative, but does not open a modal                                           |
| `src/layouts/app-layout.tsx`     | Banner, nav, main outlet, footer, cart sheet, auth dialog      | `client/src/app/layouts/storefront-layout/storefront-layout.ts/html` | Storefront header and outlet                              | `PARTIAL`        | Banner/footer/cart sheet/auth dialog are missing                                                         |
| `src/layouts/account-layout.tsx` | Account sidebar with order/reviews/address links, back, logout | `client/src/app/layouts/account-layout/account-layout.ts/html`       | Account sidebar and nested outlet                         | `PARTIAL`        | Angular has the structure and logout, but no Lucide icons and path semantics differ from React `/orders` |
| `src/layouts/admin-layout.tsx`   | Admin sidebar/header, role check, storefront/logout actions    | `client/src/app/layouts/admin-layout/admin-layout.ts/html`           | Admin shell and nested outlet                             | `PARTIAL`        | Angular uses real `adminGuard` and real AuthService; current responsive shell is simpler                 |
| `src/pages/not-found/index.tsx`  | Not-found page                                                 | No dedicated Angular not-found component                             | `**` redirects to `/` in `app.routes.ts`                  | `PARTIAL`        | Angular silently redirects instead of showing a not-found state                                          |

### Global React components

| React file                          | React responsibility                                             | Angular equivalent                                           | Status        | Notes                                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------- |
| `src/components/banner.tsx`         | Free-delivery/promotion banner                                   | None                                                         | `NOT_STARTED` | No Angular banner found                                                                               |
| `src/components/nav.tsx`            | Search, theme toggle, auth menu, cart button                     | `layouts/storefront-layout/storefront-layout.ts/html`        | `PARTIAL`     | Current Angular header has search/user/cart basics but no real theme toggle and less complete auth UX |
| `src/components/footer.tsx`         | Storefront footer                                                | None                                                         | `NOT_STARTED` | Must be added to storefront layout later                                                              |
| `src/components/cart-button.tsx`    | Cart icon and item badge                                         | Inline cart button in storefront layout; `core/cart/cart.ts` | `PARTIAL`     | Badge/count exists, but no icon component and navigation replaces the React sheet                     |
| `src/components/cart-sheet.tsx`     | Right-side cart drawer, quantities, totals, checkout/auth action | `features/cart/cart-page/cart-page.html/ts`                  | `PARTIAL`     | Angular has a page, not a reusable drawer; guest/auth checkout behavior differs                       |
| `src/components/auth-dialog.tsx`    | Modal login/register controlled by Zustand                       | `features/auth/auth-page/auth-page.ts` and form components   | `PARTIAL`     | Angular navigates to `/auth`; no overlay dialog or shared modal state                                 |
| `src/components/logo.tsx`           | Logo asset/link                                                  | Text `Nexora` links in layouts                               | `PARTIAL`     | React image/logo not migrated; Angular uses text                                                      |
| `src/components/mode-toggle.tsx`    | Light/dark mode control                                          | `core/services/theme.ts` placeholder and header button       | `NOT_STARTED` | Service is currently a placeholder and button has no behavior                                         |
| `src/components/theme-provider.tsx` | Theme persistence and document class                             | `core/services/theme.ts`                                     | `NOT_STARTED` | No implemented signal/storage/theme application found                                                 |
| `src/components/product-card.tsx`   | Product display and cart add action                              | `shared/components/product-card/product-card.ts/html`        | `PARTIAL`     | Main fields and add action exist; stock/price image shapes and visual details differ                  |

### React UI primitives

| React files                                                                                            | Angular equivalent                                            | Status           | Notes                                                                              |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `src/components/ui/button.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `checkbox.tsx`, `select.tsx` | Native HTML controls, Tailwind, some Angular Material setup   | `PARTIAL`        | Behavior is covered in pages, but no consistent shared Angular control layer       |
| `src/components/ui/card.tsx`, `table.tsx`, `badge.tsx`, `empty.tsx`, `skeleton.tsx`, `spinner.tsx`     | Inline Tailwind structures in feature templates               | `PARTIAL`        | Repeated visual language is present but not componentized                          |
| `src/components/ui/dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `popover.tsx`                        | No equivalent shared Angular primitives                       | `NOT_STARTED`    | Required for full auth/cart/account parity                                         |
| `src/components/ui/tabs.tsx`                                                                           | Inline signal-driven buttons in account reviews               | `PARTIAL`        | Tabs work functionally but are not a reusable component                            |
| `src/components/ui/accordion.tsx`                                                                      | Inline checkout sections                                      | `PARTIAL`        | React accordion behavior is not fully represented                                  |
| `src/components/ui/sidebar.tsx`                                                                        | `layouts/admin-layout` and `layouts/account-layout` templates | `REQUIRES_SPLIT` | Angular owns each shell directly rather than porting the generic sidebar primitive |
| `src/components/ui/carousel.tsx`                                                                       | Home categories/deals templates                               | `PARTIAL`        | React carousel interactions are not fully present in Angular                       |
| `src/components/ui/sonner.tsx`                                                                         | `core/services/notification.ts` placeholder                   | `NOT_STARTED`    | No functional toast mechanism found                                                |

### React pages and Angular pages

| React file                                              | React responsibility                                           | Angular equivalent                                                                                                                           | Angular responsibility                                  | Status           | Notes                                                                                                             |
| ------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/pages/home/index.tsx`                              | Composes hero/categories/deals/more products                   | `features/home/home-page/home-page.ts/html`                                                                                                  | Home orchestration and data load                        | `PARTIAL`        | Categories/deals/products exist; hero carousel is missing                                                         |
| `src/pages/home/hero-carousel.tsx`                      | Three-slide promotional carousel                               | None                                                                                                                                         | None                                                    | `NOT_STARTED`    | Requires assets and carousel behavior                                                                             |
| `src/pages/home/categories-section.tsx`                 | Category cards/carousel                                        | `features/home/categories-section/categories-section.ts/html`                                                                                | Category display                                        | `PARTIAL`        | Angular loads categories but visual carousel parity is incomplete                                                 |
| `src/pages/home/deals-section.tsx`                      | Deals grid and product cards                                   | `features/home/deals-section/deals-section.ts/html`                                                                                          | Deals display                                           | `PARTIAL`        | Uses Angular ProductCard but not exact React layout/feedback                                                      |
| `src/pages/home/product-sections.tsx`                   | More-products grid/loading/see-more                            | `features/home/home-page/home-page.html` plus `ProductCardComponent`                                                                         | Featured products                                       | `REQUIRES_MERGE` | Angular folds this into home rather than a dedicated component                                                    |
| `src/pages/products/index.tsx`                          | Category/filter/sort/pagination/product grid                   | `features/products/products-page/products-page.ts/html`, `features/products/services/catalog.ts`                                             | Catalog query and UI                                    | `PARTIAL`        | Core query behavior exists; UI/loading/empty fidelity is incomplete                                               |
| `src/pages/search-results/index.tsx`                    | URL search query, sort, result states                          | `features/search/search-page/search-page.ts/html`                                                                                            | Search query and result UI                              | `PARTIAL`        | Query and sort exist; exact React skeleton/empty behavior differs                                                 |
| `src/pages/product-detail/index.tsx`                    | Detail, gallery, cart card, reviews, related products          | `features/product-detail/product-detail-page/*`, `features/product-detail/services/product-detail.ts`, `features/reviews/services/review.ts` | Detail data, review data and display                    | `PARTIAL`        | Angular has data/read states, but cart controls/gallery/rating breakdown and exact UI are incomplete              |
| `src/pages/checkout/index.tsx`                          | Accordion checkout flow and summary                            | `features/checkout/checkout-page/*`, `features/addresses/services/address.ts`, `features/checkout/services/order.ts`                         | Checkout data and order placement                       | `PARTIAL`        | Backend calls exist; Angular template is materially simpler than React child-panel flow                           |
| `src/pages/checkout/components/address-section.tsx`     | Select/add address                                             | `features/addresses/addresses-page/*` and checkout template                                                                                  | Address selection/management                            | `REQUIRES_MERGE` | Angular address page exists, but no equivalent checkout child component                                           |
| `src/pages/checkout/components/payment-section.tsx`     | Payment method selector                                        | `features/checkout/checkout-page/checkout-page.html`                                                                                         | Payment selection                                       | `REQUIRES_MERGE` | Inline Angular controls should eventually become a checkout component                                             |
| `src/pages/checkout/components/review-section.tsx`      | Review order and place action                                  | `features/checkout/checkout-page/checkout-page.html`                                                                                         | Review/order action                                     | `REQUIRES_MERGE` | Inline behavior is present but less complete                                                                      |
| `src/pages/checkout/components/order-summary.tsx`       | Server totals summary                                          | `features/checkout/checkout-page/checkout-page.html` and `core/cart/cart.ts`                                                                 | Totals display                                          | `PARTIAL`        | Server totals are modeled but exact sticky summary parity is missing                                              |
| `src/pages/account/addresses.tsx`                       | Dialog-based create address and cards                          | `features/addresses/addresses-page/*`, `features/addresses/services/address.ts`                                                              | Address CRUD and form                                   | `PARTIAL`        | Angular has broader CRUD but uses an inline form instead of React dialog/card design                              |
| `src/pages/account/reviews.tsx`                         | Reviewable/reviewed tabs and create review cards               | `features/reviews/account-reviews/*`, `features/reviews/services/review.ts`                                                                  | Signals, typed forms and review APIs                    | `PARTIAL`        | Main behavior exists; visual primitives/icons/toasts differ                                                       |
| `src/pages/orders/orders.tsx`                           | Order history cards/loading/empty                              | `features/orders/orders-page/*`, `features/checkout/services/order.ts`                                                                       | Order list                                              | `PARTIAL`        | Route and data exist; card visuals and link paths differ                                                          |
| `src/pages/orders/order-tracking.tsx`                   | Timeline, detail/sidebar/payment summary                       | `features/orders/order-detail-page/*`                                                                                                        | Order detail and review form                            | `PARTIAL`        | Angular has detail/status history but not React stepper/sidebar parity                                            |
| `src/pages/orders/components/delivery-timeline.tsx`     | Delivery status stepper                                        | Folded into `order-detail-page.html` status history                                                                                          | Status history display                                  | `REQUIRES_SPLIT` | Angular needs a dedicated timeline component for parity                                                           |
| `src/pages/orders/components/order-detail-sidebar.tsx`  | Address/payment/order totals sidebar                           | Folded into `order-detail-page.html`                                                                                                         | Sidebar sections                                        | `REQUIRES_SPLIT` | Responsibility exists but component boundary is missing                                                           |
| `src/pages/orders/components/order-status-badge.tsx`    | Status-colored badge                                           | Inline status spans in order templates                                                                                                       | Status text                                             | `PARTIAL`        | No shared badge/status-color equivalent                                                                           |
| `src/pages/admin/dashboard.tsx`                         | Four analytics cards plus recent orders                        | `features/admin/dashboard/dashboard.ts/html`                                                                                                 | Product/order totals and recent orders                  | `PARTIAL`        | NestJS current backend has no analytics endpoint; Angular intentionally shows only confirmed product/order counts |
| `src/pages/admin/products.tsx`                          | Product admin table, stock badge, pagination, new-product link | `features/admin/products/products.ts/html`, `features/admin/services/admin.ts`                                                               | Admin product list and actions                          | `PARTIAL`        | Angular supports list/status/delete; table is simpler and lacks exact React presentation                          |
| `src/pages/admin/orders.tsx`                            | Admin order table, status selector, filtering, pagination      | `features/admin/orders/orders.ts/html`, `features/admin/services/admin.ts`                                                                   | Admin order list/status update                          | `PARTIAL`        | Core endpoint exists; status filtering/history UI and badge fidelity differ                                       |
| `src/pages/admin/new-product.tsx`                       | Validated product creation, AI buttons and image uploader      | `features/admin/new-product/new-product.ts/html`, `features/admin/services/admin.ts`                                                         | Reactive form, one-file multipart create and AI actions | `PARTIAL`        | AI and one-file create are present; multi-image uploader cannot match Nest contract                               |
| `src/pages/admin/components/product-image-uploader.tsx` | Multi-file upload, URL input, previews, remove/upload          | No equivalent; file control in `new-product.html`                                                                                            | Single required image selection/preview                 | `PARTIAL`        | NestJS `POST /api/product` accepts one `image` file; React upload helper is not a valid Nest endpoint             |

### Angular-only/current migration files

| Angular file/group                             | Responsibility                      | React counterpart                                          | Status           | Notes                                                                                          |
| ---------------------------------------------- | ----------------------------------- | ---------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| `features/admin/services/admin.ts`             | Typed Nest admin HTTP facade        | React `lib/api.ts` admin functions                         | `REQUIRES_SPLIT` | Correct Angular service boundary; combines several React API helpers                           |
| `features/auth/account-placeholder/*`          | Temporary account fallback          | None direct                                                | `NOT_NEEDED`     | Current routes now use AccountLayout; placeholder should remain only if another route needs it |
| `features/products/services/product.ts`        | Empty `Product` service placeholder | None                                                       | `NOT_NEEDED`     | Duplicate/unused placeholder; catalog service is the real implementation                       |
| `features/orders/services/order.ts`            | Empty `Order` service placeholder   | None                                                       | `NOT_NEEDED`     | Real order service is under checkout; placeholder has no behavior                              |
| `core/services/theme.ts` and `notification.ts` | Intended global service boundaries  | React ThemeProvider/Sonner                                 | `PARTIAL`        | Correct placement but implementations are placeholders                                         |
| `core/cart/cart-storage.ts`                    | Small cart count helper             | React inline Zustand selector                              | `NOT_NEEDED`     | Angular-specific utility, not a direct React file                                              |
| Angular `*.spec.ts` files                      | Component/service/guard tests       | React has no matching test files in the inventoried source | `NOT_NEEDED`     | Angular architecture adds test seams; current repository test runner has baseline failures     |

## 6. Layout Mapping

| React layout                                          | Angular layout     | Angular path                                       | Status        | Details                                                                                                           |
| ----------------------------------------------------- | ------------------ | -------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Root route layout with `ScrollRestoration` and outlet | Root `App`         | `client/src/app/app.ts`, `app.html`                | `PARTIAL`     | Outlet exists; no explicit scroll restoration equivalent was found                                                |
| `AppLayout`                                           | `StorefrontLayout` | `client/src/app/layouts/storefront-layout/`        | `PARTIAL`     | Header/outlet/search/auth/cart basics exist; banner/footer/cart drawer/auth modal/theme are missing or simplified |
| `AccountLayout`                                       | `AccountLayout`    | `client/src/app/layouts/account-layout/`           | `PARTIAL`     | Sidebar and protected nesting exist; React paths and icons/visual details differ                                  |
| `AdminLayout`                                         | `AdminLayout`      | `client/src/app/layouts/admin-layout/`             | `PARTIAL`     | Admin guard is stronger than React's current hardcoded placeholder; shell still needs exact UI parity             |
| `Banner`                                              | None               | None                                               | `NOT_STARTED` | React displays this above the nav                                                                                 |
| `Nav`                                                 | Storefront header  | `layouts/storefront-layout/storefront-layout.html` | `PARTIAL`     | Search/account/cart are present in simplified form; no actual shared logo/cart button/mode toggle                 |
| `Footer`                                              | None               | None                                               | `NOT_STARTED` | React AppLayout includes it                                                                                       |
| `CartSheet`                                           | Cart page          | `features/cart/cart-page/`                         | `PARTIAL`     | Page replacement is not behaviorally equivalent to a slide-out sheet                                              |
| `AuthDialog`                                          | Auth route/page    | `features/auth/`                                   | `PARTIAL`     | Navigation route is not modal overlay behavior                                                                    |

## 7. Feature Mapping

| Feature               | React files                                                                                      | Angular files                                                                           | Status        | Missing pieces                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| Authentication        | `components/auth-dialog.tsx`, `hooks/use-auth.ts`, `hooks/use-user.ts`, `lib/api.ts`, auth types | `core/auth/auth.ts`, `features/auth/auth-page/*`, login/register forms, `auth-guard.ts` | `PARTIAL`     | Modal state, success/error feedback parity, startup session load, exact route behavior                  |
| Home                  | `pages/home/*`, `components/product-card.tsx`, home assets                                       | `features/home/*`, `shared/components/product-card/*`, `HomeService`                    | `PARTIAL`     | Hero carousel/assets, exact carousel interactions, section parity                                       |
| Categories            | `pages/home/categories-section.tsx`, category types                                              | `HomeService`, categories section, catalog models                                       | `PARTIAL`     | Image/card carousel parity and consistent category image shape                                          |
| Products catalog      | `pages/products/index.tsx`, `components/product-card.tsx`, `lib/api.ts`                          | products page, catalog service, product card, catalog models                            | `PARTIAL`     | Exact filters/empty/skeleton UI and service cancellation/state polish                                   |
| Search                | `pages/search-results/index.tsx`, `lib/api.ts`                                                   | search page, catalog service, storefront search form                                    | `PARTIAL`     | Exact empty/loading/error presentation and shared search behavior                                       |
| Product details       | `pages/product-detail/index.tsx`, product helpers, review API                                    | product detail page/service, review service, product card                               | `PARTIAL`     | Cart quantity card, image thumbnails, rating breakdown and related layout fidelity                      |
| Cart                  | `hooks/use-cart.ts`, `components/cart-sheet.tsx`, cart types/API                                 | `core/cart/cart.ts`, `cart-storage.ts`, cart page                                       | `PARTIAL`     | Local persistence, debounce, optimistic updates, rollback, stock toast, drawer, auth checkout branching |
| Checkout              | checkout page and four child components, checkout constants                                      | checkout page/service, address service, order service                                   | `PARTIAL`     | Accordion panels, add-address dialog, summary/sidebar, success query handling, exact payment UX         |
| Addresses             | `pages/account/addresses.tsx`, auth types/API                                                    | addresses page/service                                                                  | `PARTIAL`     | React dialog/card UX and matching mutation feedback; Angular has extra update/delete support from Nest  |
| Orders                | orders page, tracking page, timeline/sidebar/status badge, order API                             | orders pages, order service, detail template                                            | `PARTIAL`     | Timeline component, exact status badge, route compatibility, full responsive layout                     |
| Reviews               | account reviews page, product review display, review types/API                                   | account reviews page/service, order detail review form                                  | `PARTIAL`     | Toasts, reusable star/badge components, exact UI, product-public review breakdown                       |
| Admin dashboard       | `pages/admin/dashboard.tsx`, admin API/types                                                     | admin dashboard and `AdminService`                                                      | `PARTIAL`     | Analytics endpoint parity; only confirmed counts/recent orders can be shown from Nest                   |
| Admin orders          | `pages/admin/orders.tsx`, admin API/types                                                        | admin orders and service                                                                | `PARTIAL`     | Exact status filtering/history selector and styling                                                     |
| Admin products        | `pages/admin/products.tsx`, admin API/types                                                      | admin products and service                                                              | `PARTIAL`     | Exact table/badges/edit flow; update API exists but no Angular edit UI                                  |
| Product creation      | `pages/admin/new-product.tsx`, uploader                                                          | admin new-product page/service                                                          | `PARTIAL`     | Multi-image upload impossible against current Nest product controller; single-file flow works           |
| AI product generation | `generateProductAiMutationFn`, new-product AI buttons                                            | `AdminService.generateAi`, new-product AI controls                                      | `MATCHED`     | Request actions and destination are supported by Nest; visual control styling differs                   |
| Theme                 | `theme-provider.tsx`, `mode-toggle.tsx`, localStorage key `vite-ui-theme`                        | theme service placeholder/header button                                                 | `NOT_STARTED` | No applied theme state/storage behavior                                                                 |
| Notifications         | Sonner provider/toasts                                                                           | notification service placeholder, console error interceptor                             | `PARTIAL`     | No user-visible Angular toast system                                                                    |
| Forms/validation      | React Hook Form/Zod across auth/address/checkout/review/admin                                    | Reactive Forms/Angular Validators                                                       | `PARTIAL`     | Core forms exist, but some validators and server-field feedback are incomplete                          |

## 8. API Mapping

### Contract rule

React's `lib/api.ts` was written for an Express API whose paths differ from the current NestJS API. The NestJS controllers under `E-commerce/backend/src` are authoritative. Angular calls below are judged against NestJS, not against React path strings.

| React method/helper                | React endpoint                                     | NestJS endpoint                                             | Angular service                          | Auth                                          | Status        | Contract notes                                                                               |
| ---------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------- | --------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| `loginMutationFn`                  | `POST /auth/login`                                 | `POST /api/auth/login`                                      | `core/auth/auth.ts`                      | Public                                        | `MATCHED`     | JSON `{email,password}`; sets httpOnly access cookie; guest cart merge                       |
| `registerMutationFn`               | `POST /auth/register`                              | `POST /api/auth/register`                                   | `core/auth/auth.ts`                      | Public                                        | `MATCHED`     | JSON register DTO; sets cookie and merges guest cart                                         |
| `logoutMutationFn`                 | `POST /auth/logout`                                | `POST /api/auth/logout`                                     | `core/auth/auth.ts`                      | Current Nest controller does not guard logout | `MATCHED`     | Clears access cookie                                                                         |
| `getCurrentUser`                   | `GET /auth/status`                                 | `GET /api/auth/status`                                      | `core/auth/auth.ts`                      | JWT                                           | `MATCHED`     | Returns `{message,user}`; Angular guard uses it                                              |
| `getAllCategoriesQueryFn`          | `GET /categories`                                  | `GET /api/category`                                         | `features/home/services/home.ts`         | Public                                        | `MATCHED`     | React path is old Express plural form                                                        |
| `getProductDealsQueryFn`           | `GET /products/deals?limit`                        | `GET /api/product/deals?limit`                              | `HomeService.getDeals`                   | Public                                        | `MATCHED`     | Response `{products}`                                                                        |
| `getProductsQueryFn`               | `GET /products`                                    | `GET /api/product`                                          | `CatalogService.getProducts`             | Public                                        | `MATCHED`     | Supports category/page/limit/discount/stock/price/sort/keyword/skip                          |
| `getProductBySlugQueryFn`          | `GET /products/:slug`                              | `GET /api/product/:slug`                                    | `ProductDetailService`                   | Public                                        | `MATCHED`     | Returns product and relatedProducts                                                          |
| `getProductReviewsQueryFn`         | `GET /products/:slug/reviews`                      | `GET /api/review/product?slug=&page=&limit=`                | `ReviewService.getProductReviews`        | Public in Nest                                | `PARTIAL`     | React uses path param; Nest uses query slug; Angular uses Nest contract                      |
| `getCartQueryFn`                   | `GET /cart`                                        | `GET /api/cart`                                             | `CartService.loadCart`                   | Optional auth/guest cookie                    | `MATCHED`     | Server cart and totals                                                                       |
| `updateCartMutationFn`             | `POST /cart`                                       | `POST /api/cart`                                            | `CartService` save methods               | Optional auth/guest cookie                    | `MATCHED`     | Body `{items:[{productId,quantity}]}`                                                        |
| `getAddressesQueryFn`              | `GET /addresses`                                   | `GET /api/address`                                          | `AddressService.loadAddresses`           | JWT                                           | `MATCHED`     | User-owned addresses                                                                         |
| `createAddressMutationFn`          | `POST /addresses`                                  | `POST /api/address`                                         | `AddressService.createAddress`           | JWT                                           | `MATCHED`     | Required seven address strings; created address becomes default                              |
| React address update/delete absent | `/addresses` only in React helper                  | `PATCH/DELETE /api/address/:id`                             | `AddressService`                         | JWT                                           | `MATCHED`     | Angular consumes extra real Nest capabilities                                                |
| `createOrderMutationFn`            | `POST /orders`                                     | `POST /api/order`                                           | `OrderService.createOrder`               | JWT                                           | `MATCHED`     | Body `{addressId,paymentMethod}`; COD/Card branches                                          |
| `getOrdersQueryFn`                 | `GET /orders`                                      | `GET /api/order`                                            | `OrderService.getOrders`                 | JWT                                           | `MATCHED`     | Own orders                                                                                   |
| `getOrderByIdQueryFn`              | `GET /orders/:id`                                  | `GET /api/order/:id`                                        | `OrderService.getOrderById`              | JWT                                           | `MATCHED`     | Ownership checked by Nest                                                                    |
| `getReviewableOrderItemsQueryFn`   | `GET /reviews/reviewable`                          | `GET /api/review/reviewable`                                | `ReviewService.getReviewableOrders`      | JWT                                           | `MATCHED`     | Delivered + paid + unreviewed items                                                          |
| `getUserReviewsQueryFn`            | `GET /reviews`                                     | `GET /api/review`                                           | `ReviewService.getUserReviews`           | JWT                                           | `MATCHED`     | User's submitted reviews                                                                     |
| `createReviewMutationFn`           | `POST /reviews`                                    | `POST /api/review`                                          | `ReviewService.createReview`             | JWT                                           | `MATCHED`     | Rating 1-5, Mongo IDs, comment max 1000; transactional backend rules                         |
| `getAdminAnalyticsQueryFn`         | `GET /admin/analytics`                             | No current Nest `/api/admin/analytics` route                | None                                     | Intended admin                                | `NOT_STARTED` | React analytics cannot be called safely; Angular uses confirmed product/order counts instead |
| `getAdminOrdersQueryFn`            | `GET /admin/orders`                                | `GET /api/order/admin/all`                                  | `AdminService.getOrders`                 | JWT + admin role                              | `PARTIAL`     | Nest accepts optional status/page/limit; Angular supports those parameters                   |
| `updateOrderStatusMutationFn`      | `PUT /admin/orders/:id/status`                     | `PATCH /api/order/admin/:id/status`                         | `AdminService.updateOrderStatus`         | JWT + admin role                              | `MATCHED`     | Nest DTO controls status and optional note; backend owns transition/payment rules            |
| `getAdminProductsQueryFn`          | `GET /admin/products`                              | `GET /api/product/admin`                                    | `AdminService.getProducts`               | JWT + admin role                              | `MATCHED`     | Page/limit max 100                                                                           |
| React `createProductMutationFn`    | `POST /admin/products` JSON images                 | `POST /api/product` multipart with required `image`         | `AdminService.createProduct`             | JWT + admin role                              | `PARTIAL`     | Angular correctly uses FormData and one file; React request shape is not valid for Nest      |
| `uploadProductImagesMutationFn`    | `POST /admin/products/upload`                      | No current Nest equivalent                                  | None                                     | Intended admin                                | `NOT_STARTED` | Do not implement against current Nest contract                                               |
| `generateProductAiMutationFn`      | `POST /admin/ai/generate`                          | `POST /api/admin/ai/generate`                               | `AdminService.generateAi`                | JWT + admin role                              | `MATCHED`     | Actions `rephrase-title` and `generate-desc`; DTO title/unit/description limits apply        |
| React category admin helpers       | No category admin page in current React route list | `GET/PATCH/DELETE /api/category/admin...` and status routes | `AdminService` + Angular categories page | JWT + admin role                              | `MATCHED`     | Angular feature is backend-supported but has no direct React page counterpart                |

### Backend response and business rules verified

- Nest admin/product/category/order routes use `JwtAuthGuard` plus `RolesGuard`/admin role decorators where applicable.
- Product creation requires one multipart file named `image`, validates detected JPEG/PNG/WebP and max 5 MB, uploads through Cloudinary, and creates a product.
- Product list admin response includes pagination and `isActive`.
- Order admin status updates use the `OrderStatus` enum and can mark an order paid when delivered; Angular must not reproduce those business rules locally.
- Category creation/update/delete/status routes exist in Nest, even though the React route registry has no category admin page.
- AI generation is guarded and validates `rephrase-title`/`generate-desc`; failures are server errors.
- There is no current Nest analytics controller/module route equivalent to React `/admin/analytics`.

## 9. Authentication Mapping

| Concern             | React                                                                              | Angular                                                                        | Status    | Notes                                                                 |
| ------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------- | --------------------------------------------------------------------- |
| Auth state          | TanStack Query `useUser()` plus Zustand auth-modal store                           | `AuthService.currentUser`, `isAuthenticated`, `isLoading`, `authError` signals | `PARTIAL` | Angular has session state but no auth-modal store                     |
| Login               | React Query mutation from auth dialog                                              | `AuthService.login` + login reactive form                                      | `PARTIAL` | API and cart merge are covered; modal/success toast parity is missing |
| Registration        | React Query mutation from auth dialog                                              | `AuthService.register` + register reactive form                                | `PARTIAL` | API and validation covered; modal/toast parity missing                |
| Logout              | API mutation, cache reset, Zustand cart reset, navigate home                       | `AuthService.logout`, cart reset, navigation from layouts                      | `MATCHED` | Angular uses real server logout rather than local timeout/fake user   |
| Current user        | `GET /auth/status`, React Query                                                    | `loadCurrentUser()` signal update                                              | `MATCHED` | Both use cookie session                                               |
| Cookie transport    | Axios `withCredentials: true`                                                      | `credentialsInterceptor` clones every request with `withCredentials: true`     | `MATCHED` | httpOnly cookies remain server-owned                                  |
| Protected route     | `ProtectedGuard` plus auth dialog opening                                          | `authGuard` calls status then redirects `/auth`                                | `PARTIAL` | No modal opening; behavior is more explicit and server-backed         |
| Admin route         | React admin layout currently contains hardcoded `John`/`isAdmin: true` placeholder | `adminGuard` checks AuthService role/status                                    | `MATCHED` | Angular correctly does not hardcode an admin                          |
| Error normalization | Axios response interceptor adds `errorCode`                                        | `api-error-interceptor` calls `normalizeApiError` and logs                     | `PARTIAL` | Angular has no user-facing toast/error presenter                      |

## 10. Cart Mapping

### React cart state classification

| React behavior                             | State class             | Angular equivalent                                                                | Status        |
| ------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------- | ------------- |
| `items`                                    | Client + persistent     | `CartService.items` signal                                                        | `PARTIAL`     |
| `isCartOpen`                               | UI state                | No Angular cart-open signal; route navigates to cart page                         | `NOT_STARTED` |
| `isCartLoading`                            | Server/UI state         | `CartService.loading` signal                                                      | `MATCHED`     |
| `subTotal`, delivery, tax, total           | Server-derived state    | Signals populated from `CartResponse`                                             | `MATCHED`     |
| Zustand persist key `instant-cart`         | Persistent client state | No localStorage persistence in Angular cart                                       | `NOT_STARTED` |
| Guest cart cookie                          | Server/session state    | Credentials interceptor; backend optional guard owns cookie                       | `MATCHED`     |
| Guest cart merge after login               | Server business rule    | AuthService calls cart reset/load after auth; Nest auth service merges guest cart | `MATCHED`     |
| Stock check before add/update              | Client guard plus toast | No equivalent stock rejection in Angular `CartService`                            | `NOT_STARTED` |
| Optimistic add/update/remove/clear         | Client transient state  | Angular waits for POST response and applies server response                       | `PARTIAL`     |
| 500 ms debounce                            | Client async state      | No debounce                                                                       | `NOT_STARTED` |
| Rollback snapshot on failed sync           | Client error recovery   | No rollback snapshot                                                              | `NOT_STARTED` |
| Toast promise saving/success/error         | UI feedback             | Error signal/console interceptor only                                             | `NOT_STARTED` |
| Drawer item quantity/remove controls       | UI component            | Cart page controls                                                                | `PARTIAL`     |
| Checkout when logged out opens auth dialog | Cross-feature UI flow   | Protected route redirects to auth page                                            | `PARTIAL`     |

### Cart dependency conclusion

`React useCart` should not map to one giant Angular component. The correct target is:

```text
React hooks/use-cart.ts
        -> core/cart/cart.ts (server state + signals)
        -> core/cart/cart-storage.ts (only if persistence is deliberately added)
        -> shared/cart presentation or layouts/cart-sheet (drawer UI)
        -> AuthService (merge/session reset)
        -> notification service (stock/sync feedback)
```

The highest-risk cart gaps are persistence, debounce, optimistic rollback, and drawer/auth behavior. Totals and stock authority must remain on the NestJS server.

## 11. State Management Mapping

| React state                                       | Classification                        | Angular target                                            | Current status        |
| ------------------------------------------------- | ------------------------------------- | --------------------------------------------------------- | --------------------- |
| TanStack Query product/category/order/review data | Server state                          | Feature service + signals + RxJS subscriptions            | `PARTIAL`             |
| Zustand `useCart.items`                           | Client/persistent/server-synchronized | Injectable `CartService.items` signal                     | `PARTIAL`             |
| Zustand `isCartOpen`                              | UI state                              | Signal in cart UI/layout                                  | `NOT_STARTED`         |
| Zustand auth modal `isAuthOpen/view`              | UI state                              | Auth dialog service/signal                                | `NOT_STARTED`         |
| React Hook Form values                            | Form state                            | Typed Reactive Forms                                      | `PARTIAL`             |
| Zod schemas                                       | Validation state                      | Angular Validators and server validation                  | `PARTIAL`             |
| `useSearchParams` category/query                  | URL state                             | `ActivatedRoute.queryParamMap` and Router query params    | `MATCHED`             |
| `useParams` slug/orderId                          | URL state                             | `ActivatedRoute.paramMap`                                 | `MATCHED`             |
| `useState` rating/comment                         | Form/UI state                         | Reactive Form controls and signals                        | `MATCHED` for reviews |
| React Query mutation pending flags                | Async UI state                        | Signals such as `saving`, `placingOrder`, `submittingKey` | `PARTIAL`             |
| localStorage theme key                            | Persistent UI state                   | Theme service                                             | `NOT_STARTED`         |
| localStorage Zustand cart                         | Persistent cart state                 | No current storage adapter                                | `NOT_STARTED`         |
| Axios error object                                | Error state                           | `ApiError` normalization/interceptor                      | `PARTIAL`             |

No evidence supports adding NgRx. Injectable services, signals, Reactive Forms and RxJS are sufficient for the current architecture.

## 12. Routing Mapping

| React route           | React layout/guard           | Angular route                                  | Angular layout/guard | Status                        | Notes                                                    |
| --------------------- | ---------------------------- | ---------------------------------------------- | -------------------- | ----------------------------- | -------------------------------------------------------- |
| `/`                   | AppLayout                    | `/` child of StorefrontLayout                  | StorefrontLayout     | `MATCHED`                     | Home component exists                                    |
| `/products`           | AppLayout                    | `/products` child of StorefrontLayout          | StorefrontLayout     | `MATCHED`                     | Lazy-loaded                                              |
| `/products/:slug`     | AppLayout                    | `/products/:slug` child of StorefrontLayout    | StorefrontLayout     | `MATCHED`                     | Lazy-loaded                                              |
| `/search-results?q=`  | AppLayout                    | `/search-results?q=` child of StorefrontLayout | StorefrontLayout     | `MATCHED`                     | Query state is Angular-native                            |
| `/checkout`           | AppLayout + ProtectedGuard   | `/checkout` child of StorefrontLayout          | `authGuard`          | `PARTIAL`                     | Angular guard redirects to auth route, no auth modal     |
| `/orders`             | AppLayout + AccountLayout    | `/account/orders` under AccountLayout          | `authGuard` parent   | `PARTIAL`                     | URL differs from React                                   |
| `/orders/:orderId`    | AccountLayout                | `/account/orders/:id`                          | `authGuard` parent   | `PARTIAL`                     | URL and param name differ; behavior exists               |
| `/account/reviews`    | AccountLayout                | `/account/reviews`                             | `authGuard` parent   | `MATCHED`                     | Lazy-loaded                                              |
| `/account/addresses`  | AccountLayout                | `/account/addresses`                           | `authGuard` parent   | `MATCHED`                     | Lazy-loaded                                              |
| `/admin`              | ProtectedGuard + AdminLayout | `/admin` AdminLayout                           | `adminGuard`         | `MATCHED`                     | Angular guard is real and role-based                     |
| `/admin/orders`       | AdminLayout                  | `/admin/orders`                                | `adminGuard`         | `MATCHED`                     | Lazy-loaded                                              |
| `/admin/products`     | AdminLayout                  | `/admin/products`                              | `adminGuard`         | `MATCHED`                     | Lazy-loaded                                              |
| `/admin/products/new` | AdminLayout                  | `/admin/products/new`                          | `adminGuard`         | `MATCHED`                     | Lazy-loaded                                              |
| `/admin/categories`   | Not in React route registry  | `/admin/categories`                            | `adminGuard`         | `NOT_NEEDED` as React mapping | Backend-supported Angular addition, no React counterpart |
| `*`                   | NotFoundPage                 | `** -> /`                                      | None                 | `PARTIAL`                     | Angular should eventually display a not-found page       |

## 13. Forms & Validation

| React form           | React validation                                       | Angular form                                       | Status                        | Notes                                                                       |
| -------------------- | ------------------------------------------------------ | -------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| Auth login           | Zod email/password                                     | `features/auth/login-form` typed form              | `PARTIAL`                     | Validators exist; template/file organization has had current worktree moves |
| Auth register        | Zod name/email/password min 6                          | `features/auth/register-form` typed form           | `PARTIAL`                     | Core validators exist                                                       |
| Address create       | `addressSchema`, all fields min 1                      | `features/addresses/addresses-page` typed group    | `PARTIAL`                     | Angular also supports update/delete; exact dialog UX is missing             |
| Checkout address     | Reuses address schema in child                         | Inline checkout/address service                    | `PARTIAL`                     | No dedicated Angular checkout address child component                       |
| Checkout payment     | Enum `CheckoutPaymentMethod`                           | `PaymentMethod` signal                             | `PARTIAL`                     | Selection exists; exact accordion/validation flow differs                   |
| Review create        | rating 1-5, optional comment                           | Typed per-entry `ReviewForm` or order detail form  | `MATCHED`                     | Backend also enforces Mongo IDs and max comment length                      |
| Admin product create | Zod name/price/discount/unit/stock plus image required | `new-product` typed Reactive Form plus file signal | `PARTIAL`                     | Single multipart image matches Nest; multi-image React flow does not        |
| Admin category edit  | React route has no current category UI                 | Angular categories typed form                      | `NOT_NEEDED` as React mapping | Backend-supported Angular admin capability                                  |
| Admin order status   | UI selector; backend validates                         | `OrderStatus` union and service PATCH              | `MATCHED`                     | Angular should not add client transition rules                              |

## 14. Shared Components

### Recommended Angular ownership

| React component                                         | Recommended Angular location                               | Current Angular state   | Status           |
| ------------------------------------------------------- | ---------------------------------------------------------- | ----------------------- | ---------------- |
| `ProductCard`                                           | `shared/components/product-card`                           | Exists                  | `PARTIAL`        |
| `Banner`                                                | `layouts/storefront-layout` or shared storefront component | Missing                 | `NOT_STARTED`    |
| `Nav`                                                   | `layouts/storefront-layout`                                | Folded into layout      | `PARTIAL`        |
| `Footer`                                                | `layouts/storefront-layout`                                | Missing                 | `NOT_STARTED`    |
| `CartButton`                                            | `layouts/storefront-layout` or shared cart component       | Inline button           | `PARTIAL`        |
| `CartSheet`                                             | `layouts/storefront-layout` plus `features/cart`           | Page only               | `PARTIAL`        |
| `AuthDialog`                                            | `core/auth` state + shared dialog + auth feature forms     | Auth route only         | `PARTIAL`        |
| `OrderStatusBadge`                                      | `shared/components/order-status-badge`                     | Inline spans            | `NOT_STARTED`    |
| `DeliveryTimeline`                                      | `features/orders/components/delivery-timeline`             | Folded into detail page | `REQUIRES_SPLIT` |
| `OrderDetailSidebar`                                    | `features/orders/components/order-detail-sidebar`          | Folded into detail page | `REQUIRES_SPLIT` |
| `ProductImageUploader`                                  | `features/admin/new-product`                               | Single file input       | `PARTIAL`        |
| `Skeleton`, `Empty`, `Badge`, `Tabs`, `Dialog`, `Sheet` | `shared/ui` only when reused by at least two domains       | Mostly inline Tailwind  | `REQUIRES_SPLIT` |
| `ThemeProvider`/`ModeToggle`                            | `core/services/theme.ts` plus shared control               | Placeholder             | `NOT_STARTED`    |
| `Toaster`/toast helpers                                 | `core/services/notification.ts`                            | Placeholder             | `NOT_STARTED`    |

## 15. Assets & Styling

### React assets

The React source contains these asset groups:

- `src/assets/hero.png`
- `src/assets/images/carousel-img-1.png`, `carousel-img-2.png`, `carosuel-img-3.png`
- `src/assets/images/product-img-1.jpeg`, `product-img-2.png`
- `src/assets/product-imgs/fruit.jpeg`, `juice.jpeg`, `product-imge-1.jpeg`, `strawberry.jpeg`
- `src/assets/cats-img/*.png` for nine categories
- `src/assets/logo.png`, plus `react.svg` and `vite.svg`

The React home components import/use the hero and category/product assets. No equivalent complete asset set was found under Angular `client/src`; Angular build assets currently come from `client/public` and CSS/theme setup.

### Styling and typography

- React uses Tailwind CSS v4 plus shadcn CSS variables from `src/index.css`.
- React visual vocabulary includes `bg-background`, `text-foreground`, `border-border`, `primary`, `secondary`, `green-light`, card/table/badge primitives, Lucide icons, rounded cards and responsive `md/lg/xl` layouts.
- Angular uses Tailwind CSS v4 in `src/styles.css`, with additional Angular Material setup in current worktree (`src/material-theme.scss`, `angular.json`, package changes).
- Angular feature templates mostly use explicit `slate-*` colors rather than React's semantic CSS variables, so visual parity is partial.
- React has dark-mode/theme provider and persistent theme storage. Angular theme service is currently a placeholder.
- React has responsive mobile behavior for cart sheet/sidebar/carousels. Angular has responsive grids/nav in places, but no equivalent drawer/sidebar primitives.

## 16. Missing Angular Features

1. Storefront banner and footer.
2. Global cart drawer/sheet with open state.
3. Auth dialog overlay and auth modal state.
4. Functional theme persistence and mode toggle.
5. User-visible toast/notification system.
6. React hero carousel with its assets and auto-play/dot behavior.
7. Full product-detail cart card, quantity controls and gallery.
8. Rating breakdown and exact public review presentation.
9. React checkout accordion and child component layout.
10. React order tracking stepper and reusable status badge/sidebar components.
11. Cart localStorage persistence under the React key/semantics.
12. Cart optimistic update, 500 ms debounce and rollback behavior.
13. React admin analytics metrics because no current Nest endpoint exists.
14. React multi-image Cloudinary uploader because no current Nest equivalent exists.
15. Angular not-found page; wildcard currently redirects home.

## 17. Partial Migrations

- Auth works through Angular signals and Nest cookies, but the modal UX and startup/global feedback are incomplete.
- Storefront routing and a header exist, but the React AppLayout composition is not complete.
- Home has category/deals/product data services, but hero/carousel/assets are incomplete.
- Product catalog and search query behavior are present, but UI states and exact visual fidelity are incomplete.
- Product details load product/related/reviews, but cart card/gallery/rating breakdown parity is incomplete.
- Cart has server GET/POST and server totals, but React client persistence and optimistic synchronization are missing.
- Checkout can load addresses and create orders, but its UI is materially simpler than React.
- Addresses have more backend CRUD coverage than React but use a different inline form UX.
- Orders and order details load real Nest data; tracking and status badge composition are incomplete.
- Reviews page has the main tabs/forms/API behavior using Angular signals and typed forms; toast/icons/card parity is incomplete.
- Admin dashboard shows only verified product/order counts and recent orders; React analytics metrics are unavailable in current Nest.
- Admin product/category/order pages have real Nest service methods, but tables, badges, confirmations, mutation feedback and filters need parity work.
- New product supports one real file, form validation and Nest AI actions; multi-image upload remains unsupported.

## 18. React Files Without Angular Equivalent

| React file                                                                                      | Reason                                                                               |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/components/banner.tsx`                                                                     | No Angular banner component                                                          |
| `src/components/footer.tsx`                                                                     | No Angular footer                                                                    |
| `src/components/auth-dialog.tsx`                                                                | Angular uses route page instead of modal                                             |
| `src/components/cart-sheet.tsx`                                                                 | Angular has cart page, no sheet                                                      |
| `src/components/mode-toggle.tsx`                                                                | Theme behavior is not implemented                                                    |
| `src/components/theme-provider.tsx`                                                             | No functional Angular theme implementation                                           |
| `src/pages/home/hero-carousel.tsx`                                                              | No Angular hero carousel                                                             |
| `src/pages/orders/components/delivery-timeline.tsx`                                             | Folded into order-detail template, not a separate equivalent                         |
| `src/pages/orders/components/order-detail-sidebar.tsx`                                          | Folded into order-detail template                                                    |
| `src/components/ui/dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `sidebar.tsx`, `carousel.tsx` | No one-to-one Angular primitive; some behavior is inline or absent                   |
| `src/pages/admin/components/product-image-uploader.tsx`                                         | Current Nest product endpoint supports one file, not React's multi-image upload flow |
| `src/lib/api.ts:getAdminAnalyticsQueryFn`                                                       | Current Nest backend has no matching analytics endpoint                              |
| `src/lib/api.ts:uploadProductImagesMutationFn`                                                  | Current Nest backend has no matching `/api/admin/products/upload` endpoint           |

## 19. Angular Files Without React Equivalent

| Angular file/group                                     | Reason                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `src/app/core/interceptors/credentials-interceptor.ts` | Angular HttpClient cross-cutting cookie transport                             |
| `src/app/core/interceptors/api-error-interceptor.ts`   | Angular cross-cutting error normalization                                     |
| `src/app/core/guards/auth-guard.ts`, `admin-guard.ts`  | Angular route guard architecture; React guard is a component                  |
| `src/app/core/services/auth-state.ts`                  | Angular state boundary; no direct React file found                            |
| `src/app/core/cart/cart-storage.ts`                    | Angular-specific helper                                                       |
| `src/app/features/admin/categories/*`                  | Nest supports category admin CRUD but React route registry does not expose it |
| `src/app/features/*/services/*.ts`                     | Angular service decomposition of React Query/API helpers                      |
| `src/app/shared/models/catalog.ts`                     | Angular typed model consolidation                                             |
| Angular `*.spec.ts` files                              | Angular test structure; React source inventory had no direct equivalent tests |
| `src/material-theme.scss`                              | Current Angular Material configuration, not present in React                  |

## 20. Migration Risks

1. **Backend path mismatch:** React uses old plural Express paths (`/products`, `/orders`, `/reviews`, `/addresses`, `/admin/*`); current Nest uses singular `/api/product`, `/api/order`, `/api/review`, `/api/address` and role-protected routes. Never copy React URLs.
2. **Analytics mismatch:** Calling React `/admin/analytics` from Angular would fail because no current Nest controller exposes it. Displaying invented revenue/users metrics would be incorrect.
3. **Upload mismatch:** React's multi-image upload helper and JSON image creation flow are not compatible with Nest's single multipart `POST /api/product` controller.
4. **Cart regression risk:** Replacing Zustand persistence with server-only state changes guest behavior and loses offline/instant UI updates.
5. **Order route mismatch:** React links `/orders/:orderId`, while Angular uses `/account/orders/:id`; links must be normalized consistently or users will land on wildcard redirect.
6. **Auth UX mismatch:** Angular route redirects cannot reproduce React's auth dialog without a shared dialog state/service.
7. **Image shape mismatch:** Nest product/category schemas return image objects (`{url,publicId}`), while several React views expect string URLs. Angular models and image helpers must normalize explicitly.
8. **Status mutation rules:** React filters status choices in the UI, but Nest owns valid transitions, payment changes and history. Angular must not create a conflicting transition algorithm.
9. **Error feedback:** Angular interceptors currently log normalized errors; missing toast/field feedback can make failed mutations appear silent.
10. **Current worktree moves:** Existing auth files are both deleted at old paths and untracked at folder paths. Route/import changes must use the current paths, not stale history.
11. **Template diagnostics:** Some editor diagnostics previously reported stale template/class information after formatter changes. The Angular compiler/build is the decisive check.
12. **Testing baseline:** Existing Angular tests currently fail before executing normally due missing testing imports/types and a HomePage export mismatch. New migration work must not claim the suite is green.
13. **Duplicate placeholders:** Empty `features/products/services/product.ts` and `features/orders/services/order.ts` can mislead future work; the real catalog/order services are elsewhere.
14. **Subscription lifecycle:** Some existing Angular pages subscribe in constructors; future work should use `takeUntilDestroyed` or signal interop consistently.
15. **Server-authoritative totals:** Cart/order totals, stock clamping, payments and review eligibility must remain backend-derived.

## 21. Recommended Migration Order

This order follows the observed dependency graph, not the historical phase labels:

1. **Stabilize Angular foundations:** current file moves, route imports, test/build baseline, environment/API base configuration.
2. **Implement shared notification and theme services:** these are consumed by auth, cart, admin mutations and global layout.
3. **Complete storefront shell:** banner, semantic nav/logo, footer, real user menu, theme toggle, cart button and outlet.
4. **Complete auth dialog/session UX:** preserve the existing `AuthService`, add dialog state and reuse typed login/register forms.
5. **Finish shared UI primitives:** status badge, skeleton, empty, dialog/sheet, tabs and reusable form-field patterns.
6. **Finish cart state:** persistence decision, guest behavior, stock checks, optimistic updates, 500 ms debounce, rollback and server totals.
7. **Finish product card/catalog/search:** normalize image objects, exact filters, empty/loading/error states and pagination.
8. **Finish product details/reviews:** gallery, cart card, review breakdown, public reviews, related products and shared status/rating components.
9. **Finish checkout:** split address/payment/review/summary components, preserve Nest order branches and success/error behavior.
10. **Finish addresses and account shell:** match React dialog/cards and normalize `/orders` versus `/account/orders` route decisions.
11. **Finish orders/tracking:** extract timeline/sidebar/status badge and reproduce responsive tracking UI.
12. **Finish account reviews:** shared stars/badges/toasts and mutation refresh after the existing typed implementation.
13. **Finish admin tables:** exact React table/skeleton/empty/error/confirmation behavior for products, categories and orders.
14. **Finish admin new product:** keep real single-file Nest flow; add only AI actions supported by Nest and clearly defer multi-upload.
15. **Decide backend-dependent gaps:** separately scope analytics and multi-image upload only if backend changes are authorized.
16. **Add focused tests:** HTTP contract tests for every Angular service, guard tests, cart state tests and route/component tests after the repository test setup is repaired.
17. **Run visual/runtime comparison:** compare React and Angular at desktop/mobile viewports after behavior is stable.

### First Angular file to work on next

`client/src/app/layouts/storefront-layout/storefront-layout.ts` and its template are the highest-leverage next slice after the report, because every public page depends on this shell and it currently owns missing nav/auth/cart/theme behavior. The next concrete dependency underneath it is `core/services/notification.ts`, followed by a real cart-sheet/auth-dialog state boundary.

## 22. Final Migration Checklist

### Foundations

- [ ] Confirm the current Angular file layout and remove stale imports/placeholder ambiguity.
- [ ] Establish one verified API base configuration for Angular.
- [ ] Repair baseline Angular test configuration before interpreting feature tests.
- [ ] Keep credentials interceptor and Nest singular routes authoritative.

### Global shell

- [ ] Banner migrated.
- [ ] Navbar/logo/search/user menu migrated.
- [ ] Footer migrated.
- [ ] Cart button and cart sheet migrated.
- [ ] Auth dialog migrated.
- [ ] Theme provider/mode toggle migrated.
- [ ] Notification/toast system migrated.
- [ ] Not-found page migrated.

### Customer features

- [ ] Hero carousel and assets migrated.
- [ ] Categories/deals/more-products visual parity completed.
- [ ] Catalog filters, sorting, pagination and states matched.
- [ ] Search states and query behavior matched.
- [ ] Product gallery, cart card, reviews and related products matched.
- [ ] Cart persistence/optimistic/debounce/rollback behavior matched.
- [ ] Checkout accordion, address, payment, review and summary matched.
- [ ] Address dialog/cards and server errors matched.
- [ ] Orders cards and tracking timeline/sidebar matched.
- [ ] Account reviews tabs/cards/toasts matched.

### Admin features

- [ ] Admin role guard remains server-backed and never hardcodes a user.
- [ ] Dashboard shows only metrics exposed by NestJS.
- [ ] Product table/status/delete/pagination parity completed.
- [ ] Category table/status/edit/delete/pagination parity completed.
- [ ] Orders table/status/pagination/error/confirmation parity completed.
- [ ] New product form uses real multipart Nest contract.
- [ ] AI actions use `POST /api/admin/ai/generate` only.
- [ ] Multi-image upload remains deferred unless a verified Nest endpoint is added.
- [ ] Analytics remains deferred unless a verified Nest analytics endpoint is added.

### Verification

- [ ] `npm run build` passes.
- [ ] Existing Angular tests pass after baseline test setup is fixed.
- [ ] Modified-file diagnostics pass.
- [ ] React and Angular routes are compared for collisions and redirects.
- [ ] Desktop/mobile screenshots are compared for high-risk layouts.
- [ ] `git status --short` contains only intentional migration changes.

## Summary Counts

The following counts classify the **73 mapping entries** in the detailed tables above. They are not a claim that every one of the 124 React files has a one-row one-to-one mapping; repeated UI primitive files and closely related files are grouped where that is more accurate.

| Status              |  Count |
| ------------------- | -----: |
| `MATCHED`           |     25 |
| `PARTIAL`           |     31 |
| `NOT_STARTED`       |     10 |
| `REQUIRES_SPLIT`    |      4 |
| `REQUIRES_MERGE`    |      3 |
| `REQUIRES_REDESIGN` |      0 |
| `NOT_NEEDED`        |      0 |
| `UNKNOWN`           |      0 |
| **Total**           | **73** |

### Highest-priority ten gaps

1. Complete the storefront shell: banner, footer, user menu, theme and cart sheet.
2. Reproduce React auth dialog behavior instead of route-only auth.
3. Port cart persistence, optimistic updates, debounce and rollback.
4. Normalize Nest image-object responses across all Angular product/category views.
5. Complete product-detail gallery/cart/review-breakdown UI.
6. Split and complete checkout accordion, address, payment and summary components.
7. Add order tracking timeline, sidebar and shared status badge.
8. Add functional Angular notifications/toasts for mutation and validation errors.
9. Complete exact admin table states and mutation confirmations.
10. Keep analytics and multi-image upload explicitly deferred until verified Nest endpoints exist.

### Short conclusion

The migration is structurally underway, not complete. The strongest Angular matches are the Nest-backed catalog reads, auth cookie/session service, guards, basic account reviews, admin service contracts, and lazy route architecture. The largest parity gaps are global shell behavior, cart state semantics, modal/drawer UI, checkout composition, order tracking presentation, theme/notifications, and React features that the current Nest backend does not expose. The correct next implementation surface is the storefront shell, beginning with its current Angular layout and the missing notification/cart/auth state boundaries.
