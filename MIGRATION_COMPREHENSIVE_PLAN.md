# E-commerce to MERN Stack Migration: Comprehensive Task Plan

**Project:** Migrate Angular E-commerce (NestJS backend) → React MERN stack  
**Scope:** Full-stack grocery e-commerce platform with authentication, cart, checkout, orders, reviews, admin dashboard  
**Document Date:** 2025  
**Status:** Planning Phase  

---

## 1. Executive Summary

This plan consolidates a detailed audit of two production-quality e-commerce applications:
- **E-commerce (Current):** Angular 18 frontend + NestJS backend + MongoDB
- **MERN Reference:** React + Express backend + MongoDB (newer architecture, partial completion)

**Key Findings:**
- Both projects share the same backend domain model and most feature parity
- MERN frontend is ~60% complete with React patterns established in cart, checkout, orders, reviews, and admin
- NestJS backend is feature-complete with all core endpoints
- Main blockers: multi-image product creation, theme/notification UI, and exact cart drawer/auth modal behavior
- Estimated effort: **200–280 development hours** for full migration + testing

---

## 2. Architecture Comparison

### Backend Equivalence ✅ 
Both use **NestJS** with identical modules:
- `auth` → JWT cookie auth, password hashing, guest cart merge
- `cart` → guest cart + user cart, optimistic sync, stock clamping
- `product` → catalog with filters, search, sorting, pagination
- `order` → order creation, Stripe webhook, status pipeline
- `review` → review eligibility rules, rating aggregation
- `admin` → product/order management, AI generation

**Migrations needed: NONE** — React can use existing backend as-is.

### Frontend Architecture Difference

| Aspect | E-commerce (Angular) | MERN (React) |
|--------|----------------------|--------------|
| **State** | Zustand (Angular-like signal alternative) | Zustand (full coverage) |
| **Data fetching** | HttpClient + RxJS | Axios + TanStack Query (React Query) |
| **Forms** | Reactive Forms | React Hook Form + Zod |
| **UI Components** | Custom + shadcn/ui | shadcn/ui (consistent) |
| **Styling** | Tailwind CSS | Tailwind CSS (consistent) |
| **Router** | Angular Router | React Router |
| **Auth state** | `AuthState` service | `useAuth` Zustand hook |
| **HTTP interceptors** | `credentialsInterceptor` | Axios default config |

---

## 3. Feature-by-Feature Inventory & Status

### 3.1 Authentication & Authorization

**Status:** PARTIAL (React core exists, needs polish)

| Feature | NestJS Endpoint | React Completion | Notes |
|---------|-----------------|------------------|-------|
| Register | `POST /auth/register` | ✅ 95% | Form works, needs toast/modal UX |
| Login | `POST /auth/login` | ✅ 95% | Initiates cart merge, needs exact modal behavior |
| Logout | `POST /auth/logout` | ✅ 95% | Clears cart state, needs redirect logic |
| Session status | `GET /auth/status` | ❌ 30% | Hook exists but not called on app init |
| Roles (Admin) | Guard + enum | ✅ 80% | Admin role check exists; no fine-grained perms |
| Guest cart merge | On login/register | ✅ 100% | Implemented in backend, React relies on it |

**Gaps:**
- Session persistence on app load (React must call `/auth/status` in `useEffect`)
- Auth modal overlay state management (currently a route, not a modal)
- Error message formatting & display consistency

---

### 3.2 Cart System

**Status:** PARTIAL (Advanced features need integration)

| Feature | Implementation | React Completion | Notes |
|---------|-----------------|------------------|-------|
| Add to cart | `POST /cart` | ✅ 100% | Optimistic updates work |
| Update quantity | `POST /cart` (full replace) | ✅ 100% | Debounce + sync |
| Remove item | `POST /cart` (full replace) | ✅ 100% | Includes stock validation |
| View cart | `GET /cart` | ✅ 100% | Signal-based state |
| Guest cart | Cookie-based (`instant_guest_cart_id`) | ✅ 100% | Works transparently |
| Cart persistence | localStorage (Zustand) | ✅ 100% | `persist` middleware |
| Optimistic updates | 500ms debounce | ✅ 100% | Rollback on failure |
| Cart drawer UI | Slide-out component | ❌ 0% | Not implemented; currently page-based |

**Gaps:**
- Cart drawer (currently `/cart` page, not overlay)
- Stock validation toast messaging
- Cart sync during network loss recovery

---

### 3.3 Product Catalog & Browsing

**Status:** PARTIAL (Core features complete, filtering polish needed)

| Feature | Endpoint | React Completion | Notes |
|---------|----------|------------------|-------|
| List products | `GET /products` | ✅ 100% | Pagination, sorting work |
| Filter by category | `categoryId` param | ✅ 100% | UI works |
| Filter by price range | `minPrice`, `maxPrice` | ✅ 100% | Input validation needed |
| Filter deals only | `hasDiscount: true` | ✅ 100% | Works |
| Filter in-stock only | `inStock: true` | ✅ 100% | Works |
| Search (keyword) | `keyword` param | ✅ 100% | Regex search on backend |
| Sort options | `sort` param (best-match/price/rating) | ✅ 100% | Works |
| Pagination | `page`, `limit` | ✅ 100% | Page controls work |
| Product detail | `GET /product/:slug` | ✅ 100% | Includes related products |
| Related products | Aggregated by category | ✅ 100% | Shown on detail page |
| Stock display | Real-time from DB | ✅ 100% | Color-coded badge |

**Gaps:**
- "Today's Deals" section (hero carousel) — assets missing
- Category images/carousel (images are in DB but UI not connected)
- Product rating breakdown (pie chart on detail page)

---

### 3.4 Checkout & Orders

**Status:** PARTIAL (Core flow exists, status tracking incomplete)

| Feature | Endpoint | React Completion | Notes |
|---------|----------|------------------|-------|
| Address selection | `GET /addresses` | ✅ 100% | List + default selection |
| Add address | `POST /addresses` | ✅ 95% | Form works; default auto-select needs refinement |
| Create order (COD) | `POST /orders` | ✅ 95% | Immediate order creation |
| Create order (card) | Stripe session creation | ✅ 95% | Redirects to Stripe checkout |
| Order success page | After checkout | ✅ 100% | Shows order number |
| My orders | `GET /orders` | ✅ 100% | List with pagination |
| Order detail | `GET /orders/:id` | ✅ 100% | Full timeline + actions |
| Order status tracking | Status history + timeline UI | ✅ 80% | Timeline component works; custom icons/animation |
| Order cancellation | `PUT /orders/:id/cancel` | ❌ 20% | Endpoint exists; React UI incomplete |

**Gaps:**
- Full Stripe integration (redirect + webhook handling in React)
- Detailed order status history/notes display
- Order cancellation & refund status

---

### 3.5 Reviews & Ratings

**Status:** PARTIAL (Submission works, public display incomplete)

| Feature | Endpoint | React Completion | Notes |
|---------|----------|------------------|-------|
| View product reviews | `GET /review/product?slug=...` | ✅ 90% | List works; star breakdown chart missing |
| Write review (eligible) | `POST /review` | ✅ 95% | Form + submission works |
| View my reviews | `GET /review` | ✅ 100% | List with product images |
| Get reviewable items | `GET /review/reviewable` | ✅ 100% | Shows delivered orders only |
| Rating validation (1–5) | Form validation | ✅ 100% | Works |
| Star rating input | Custom component | ✅ 100% | Interactive star picker |
| Comment validation (max 1000 char) | Backend validates | ✅ 100% | Works |

**Gaps:**
- Review approval/moderation flow (not in spec)
- Public review timeline on product detail
- Rating distribution chart
- Review helpfulness voting (not in current spec)

---

### 3.6 Admin Dashboard

**Status:** PARTIAL (Analytics + list views complete, product edit missing)

| Feature | Endpoint | React Completion | Notes |
|---------|----------|------------------|-------|
| Dashboard analytics | `GET /admin/analytics` | ✅ 100% | Shows sales, orders, products, out-of-stock |
| List products | `GET /admin/products` | ✅ 100% | Paginated table |
| Create product | `POST /admin/products` | ✅ 90% | Form + single-file upload (multi-file not possible with current backend) |
| Edit product | `PATCH /admin/product/:id` | ❌ 0% | **Endpoint missing in NestJS** |
| Delete product | `DELETE /admin/product/:id` | ❌ 0% | **Endpoint missing in NestJS** |
| Activate/deactivate product | `PATCH /admin/product/:id/activate|deactivate` | ❌ 0% | Endpoint exists but React UI not hooked up |
| AI title rephrase | `POST /admin/ai/generate` (action=rephrase-title) | ✅ 100% | Works |
| AI description generate | `POST /admin/ai/generate` (action=generate-desc) | ✅ 100% | Works |
| List orders | `GET /admin/orders` | ✅ 95% | Paginated; status filter incomplete |
| Update order status | `PUT /admin/orders/:id/status` | ✅ 95% | Dropdown works; status history display incomplete |
| Product categories | `GET /categories` (public) | ✅ 100% | Listed; create/edit/delete not implemented |

**Critical Gap:**
- **Product edit/delete endpoints missing from NestJS backend** — must be added before full admin functionality

---

### 3.7 Global Features

**Status:** PARTIAL (Essentials work, UI polish incomplete)

| Feature | React Completion | Notes |
|---------|------------------|-------|
| Dark mode / theme toggle | ❌ 0% | Theme provider exists; no state/storage |
| Toast notifications | ✅ 95% | Sonner integrated; some calls missing |
| Loading states & skeletons | ✅ 90% | Mostly implemented; some edge cases |
| Error boundaries | ❌ 0% | No React error boundary components |
| Responsive design | ✅ 100% | Mobile-first Tailwind layout |
| Page scroll restoration | ✅ 100% | React Router `ScrollRestoration` |
| Network retry logic | ✅ 50% | Cart has retry; others need improvement |

---

## 4. Backend Task Breakdown (NestJS)

**Status:** Code-complete but needs production hardening.

### 4.1 Missing Endpoints (BLOCKING)

| Task | Endpoint | Impact | Effort |
|------|----------|--------|--------|
| **Add product edit endpoint** | `PATCH /api/product/:id` | Admin UI cannot edit products | 2–4h |
| **Add product delete endpoint** | `DELETE /api/product/:id` | Admin UI cannot delete products | 1–2h |
| **Connect activate/deactivate** | Verify `PATCH .../activate\|deactivate` | Admin controls partially missing | 1h |
| **Order cancellation** | `PUT /api/orders/:id/cancel` | Customer cannot cancel orders | 2–3h |

**Estimated Backend Effort:** 6–10 hours

### 4.2 Backend Polish Tasks

| Task | Scope | Effort |
|------|-------|--------|
| Add field-level validation feedback | Detailed error messages (field + reason) | 2–3h |
| Audit rate limiting | Add brute-force protection to auth | 2–3h |
| Add request/response logging | Middleware for debugging | 1–2h |
| Stripe webhook retry logic | Handle transient failures | 1–2h |
| Transaction rollback handling | Cart/order state consistency | 2–3h |

---

## 5. Frontend Task Breakdown (React)

### Phase 1: Foundation (40–50h)

#### 5.1.1 Project Setup & Infrastructure
- [ ] Create React project structure (already scaffolded in workspace)
- [ ] Verify Vite config and build pipeline
- [ ] Configure environment variables (API base URL, Stripe key)
- [ ] Set up GitHub Actions CI/CD (if needed)

**Effort:** 4–6h

#### 5.1.2 Core State Management
- [x] Zustand setup (done)
- [x] Cart store (done)
- [x] Auth store (done — needs session load on init)
- [ ] Global notifications state
- [ ] Loading/error state helpers

**Effort:** 3–4h

#### 5.1.3 HTTP Layer
- [x] Axios instance + interceptors (done)
- [ ] Request/response logging
- [ ] Retry logic for failed requests
- [ ] Timeout handling

**Effort:** 2–3h

#### 5.1.4 Layout Components
- [x] Root layout (AppLayout) — basic
- [ ] **Banner component** (top promo bar with hero image)
- [ ] **Navigation** (logo, search, category dropdown, cart button, auth)
- [ ] **Footer** (links, copyright)
- [ ] **Cart drawer** (slide-out side panel, not page)
- [ ] **Auth modal** (login/register overlay, not route)
- [ ] **Theme provider** (dark mode state + localStorage)
- [ ] Account layout sidebar
- [ ] Admin layout sidebar

**Effort:** 16–20h

### Phase 2: Feature Implementation (100–130h)

#### 5.2.1 Authentication
- [x] Login form (exists)
- [x] Register form (exists)
- [ ] **App initialization:** call `GET /auth/status` on mount to restore session
- [ ] **Modal state management:** auth modal Zustand store instead of route
- [ ] **Success/error feedback:** toast after login/register
- [ ] **Logout:** clear state and redirect
- [ ] **Protected routes:** conditional rendering + redirects

**Effort:** 8–12h

#### 5.2.2 Cart (Complete Refinement)
- [x] Add to cart (done)
- [x] Update quantity (done)
- [x] Remove item (done)
- [ ] **Cart drawer UI:** replace page with slide-out panel
- [ ] **Optimistic UI rollback:** better toast messaging on failure
- [ ] **Stock sync:** show "Quantity reduced to X" if stock changed
- [ ] **Checkout redirect:** authenticated users only
- [ ] **Guest flow:** remind guest to create account for faster checkout

**Effort:** 8–12h

#### 5.2.3 Product Catalog
- [x] Product list (done)
- [x] Filters & sorting (done)
- [x] Search (done)
- [ ] **Category carousel:** display images in hero section
- [ ] **Today's Deals section:** fetch & display discounted products
- [ ] **Product card improvements:** loading skeleton, hover effects
- [ ] **Related products:** ensure display on detail page
- [ ] **Stock badge:** style consistency

**Effort:** 6–8h

#### 5.2.4 Checkout
- [x] Address list & selection (done)
- [x] Payment method selection (done)
- [x] Order summary sidebar (done)
- [ ] **Add address form:** full validation + success feedback
- [ ] **Accordion panels:** expand/collapse address → payment → review
- [ ] **Stripe integration:** redirect on card payment, handle success/cancel URLs
- [ ] **Order success page:** show order number, estimated delivery
- [ ] **Error messaging:** field-level feedback

**Effort:** 12–16h

#### 5.2.5 Order Management
- [x] My orders list (done)
- [x] Order detail (done)
- [ ] **Status tracking timeline:** styled step indicator with icons
- [ ] **Order cancellation:** button + confirmation modal + refund status
- [ ] **Download invoice:** PDF generation (if in spec)
- [ ] **Track by number:** search/lookup page (if in spec)
- [ ] **Shipping updates:** mock or real SMS/email integration (if in spec)

**Effort:** 10–14h

#### 5.2.6 Reviews
- [x] Review submission form (done)
- [x] My reviews list (done)
- [x] Reviewable items list (done)
- [ ] **Product review display:** public list on product detail page
- [ ] **Rating distribution chart:** visual breakdown (1-star, 2-star, etc.)
- [ ] **Review sorting:** by rating, recency, helpfulness
- [ ] **Reply/moderation:** admin approve reviews (if in spec)

**Effort:** 8–10h

#### 5.2.7 Admin
- [x] Dashboard analytics (done)
- [x] Product list (done)
- [x] Product creation (done)
- [ ] **Product edit form:** BLOCKED until backend endpoint created
- [ ] **Product delete:** BLOCKED until backend endpoint created
- [ ] **Product activate/deactivate:** hook up existing backend endpoints
- [x] **AI content generation:** done
- [x] Order list (done)
- [ ] **Order status filter:** dropdown + visual status badges
- [ ] **Order status update:** with optional notes/history display
- [ ] **Category management:** CRUD if in spec

**Effort:** 14–18h (5–8h blocked pending backend)

### Phase 3: Polish & Testing (40–60h)

#### 5.3.1 UI/UX
- [ ] **Theme system:** implement light/dark mode toggle + storage
- [ ] **Toast notifications:** ensure all mutations trigger feedback
- [ ] **Loading states:** skeleton screens for all async operations
- [ ] **Empty states:** helpful messages & CTAs for empty lists
- [ ] **Error pages:** 404, 500, network error pages
- [ ] **Mobile responsiveness:** test all pages on mobile
- [ ] **Accessibility:** ARIA labels, keyboard navigation, screen reader support

**Effort:** 12–16h

#### 5.3.2 Performance
- [ ] **Code splitting:** lazy-load route components
- [ ] **Image optimization:** responsive images, WebP fallbacks
- [ ] **Bundle analysis:** identify and remove dead code
- [ ] **React Query caching:** optimize cache invalidation strategy
- [ ] **Local storage cleanup:** implement storage quotas

**Effort:** 6–8h

#### 5.3.3 Testing
- [ ] **Unit tests:** services, utilities (Jest)
- [ ] **Component tests:** critical UI components (React Testing Library)
- [ ] **Integration tests:** user flows (checkout, order placement)
- [ ] **E2E tests:** full journeys (Playwright or Cypress)

**Effort:** 16–20h

#### 5.3.4 Deployment
- [ ] **Environment config:** staging, production builds
- [ ] **Build optimization:** tree-shaking, minification
- [ ] **Error tracking:** Sentry or similar
- [ ] **Analytics:** GA4 or similar
- [ ] **SEO:** meta tags, structured data

**Effort:** 6–8h

---

## 6. Known Gaps & Challenges

### 6.1 Critical Blockers (Must Resolve Before Full Launch)

| Issue | Severity | Impact | Solution |
|-------|----------|--------|----------|
| Backend missing product edit/delete endpoints | **CRITICAL** | Admin cannot manage product catalog | Add endpoints in NestJS (6–10h) |
| Multi-image product upload | **HIGH** | Admin can only upload single image per product | Redesign backend to accept array of images |
| Cart drawer not a modal | **HIGH** | UX differs from spec; users must navigate to page | Implement as overlay component with Zustand state |
| Auth as route, not modal | **HIGH** | UX differs from E-commerce; breaks flow | Implement as modal overlay with portal |
| Session not restored on app load | **HIGH** | Users logged out after refresh | Call `GET /auth/status` in App root useEffect |

### 6.2 Medium-Priority Gaps

| Issue | Severity | Impact | Solution |
|-------|----------|--------|----------|
| Theme system not implemented | **MEDIUM** | Dark mode toggle visible but non-functional | Implement Zustand store + localStorage + CSS vars |
| Product rating breakdown chart | **MEDIUM** | Analytics incomplete on product detail | Add recharts or similar chart library |
| Order cancellation incomplete | **MEDIUM** | Customers cannot cancel orders | Implement backend endpoint + React UI |
| Stripe webhook error handling | **MEDIUM** | Payment failures may not be handled gracefully | Add retry logic + manual status reconciliation |
| No error boundary components | **MEDIUM** | Crashes propagate to blank page | Implement React error boundaries |

### 6.3 Low-Priority Polish

- Hero carousel animations
- Category image display optimization
- Review moderation UI (if admin moderation in spec)
- Invoice PDF download
- Advanced search (faceted, autocomplete)
- Wishlist / favorites (if in spec)
- Product recommendations (if in spec)

---

## 7. Migration Timeline & Effort Estimate

### By Phase

| Phase | Task | Effort (hours) | Wall Clock (weeks) |
|-------|------|----------------|-------------------|
| **0: Backend Blockers** | Add edit/delete product endpoints | 6–10 | 0.5–1 |
| **1: Foundation** | Project setup, state, HTTP, layouts | 40–50 | 2–3 |
| **2A: Auth & Cart** | Session restore, drawer, auth modal | 16–20 | 1–2 |
| **2B: Product & Checkout** | Catalog polish, checkout flow | 20–28 | 1.5–2 |
| **2C: Orders & Reviews** | Tracking, cancellation, reviews | 18–24 | 1.5–2 |
| **2D: Admin** | Edit/delete, status filters, category mgmt | 14–18 | 1–1.5 |
| **3: Polish & Testing** | UI, performance, tests, deployment | 40–60 | 2.5–3.5 |
| **TOTAL** | **Full migration** | **~220–280** | **~10–14 weeks** |

**Assumptions:**
- 1 developer (FTE) = ~30 billable hours/week
- No major scope creep
- Backend already deployed and stable
- Team familiar with React/Zustand/TanStack Query

---

## 8. Validation Criteria & Acceptance

### 8.1 Feature Parity Checklist

- [ ] All public endpoints (products, cart, orders, reviews) functional
- [ ] All admin endpoints functional (requires backend endpoint additions)
- [ ] Cart persists across sessions (localStorage + server sync)
- [ ] Guest cart merges on login
- [ ] Checkout accepts both COD and card payment
- [ ] Stripe webhook updates order status
- [ ] Review eligibility enforced (delivered + paid only)
- [ ] Product ratings updated after review submission
- [ ] Admin can create, read, (update—BLOCKED), (delete—BLOCKED) products
- [ ] Admin can update order status with history tracking

### 8.2 Performance Targets

- [ ] Home page: < 2s First Contentful Paint (FCP)
- [ ] Product list: < 1.5s with filters applied
- [ ] Checkout: < 1s form submission → order confirmation
- [ ] Admin dashboard: < 2s analytics load
- [ ] Bundle size: < 500KB gzipped (main)

### 8.3 Accessibility Standards

- [ ] WCAG 2.1 Level AA compliance
- [ ] Keyboard navigation on all interactive elements
- [ ] Screen reader announces cart updates, form errors
- [ ] Color contrast ratio ≥ 4.5:1 for text

### 8.4 Testing Coverage

- [ ] Unit tests: ≥ 80% coverage for services/utilities
- [ ] Component tests: ≥ 60% coverage for UI components
- [ ] Integration tests: Happy path + error cases for all major flows
- [ ] E2E tests: Guest checkout, user login+checkout, admin product creation

---

## 9. Risk Mitigation

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Backend endpoints incomplete/untested | Medium | Project blocked | Create test suite for NestJS endpoints upfront |
| Stripe integration misconfigured | Medium | Payment failures | Use Stripe test mode extensively; sandbox testing |
| Cart sync race conditions | Medium | Data loss | Implement server-side optimistic lock or version field |
| Admin multi-file upload conflicts with backend | High | Feature impossible | Redesign backend to accept multiple files or client-side compression |

### 9.2 Process Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Scope creep (new features during migration) | High | Timeline slip | Freeze scope; document deferred features |
| Team unfamiliar with React patterns | Medium | Quality issues | Code review + pair programming for first 2 phases |
| No dedicated QA | Medium | Bugs in production | Automated test suite + staging environment |

---

## 10. Dependency Map

### Critical Path
1. **Backend endpoints created** (edit/delete product, order cancel) → 1 week
2. **Layout components built** (banner, nav, cart drawer, auth modal) → 2 weeks
3. **Auth + cart + checkout flow** → 2 weeks
4. **Admin features** → 1.5 weeks
5. **Testing + polish** → 2.5–3.5 weeks

### Parallel Workstreams
- Backend polish (logging, validation) can happen during Phase 1–2
- Unit tests can be written incrementally during Phase 2
- CSS/theme refinement can happen during Phase 3

---

## 11. Success Criteria

### Go-Live Readiness
- [ ] All features in "Feature-by-Feature Inventory" are marked ✅ 100% or documented as "deferred"
- [ ] Backend test suite passes (including new endpoints)
- [ ] React app passes E2E test suite (happy paths + error scenarios)
- [ ] Performance metrics meet targets (see 8.2)
- [ ] Accessibility audit passes WCAG 2.1 AA
- [ ] Admin can fully manage products and orders
- [ ] Customer can place orders via both COD and card
- [ ] 0 critical bugs in UAT

### Post-Launch Monitoring
- [ ] Error rate < 0.5% on API calls
- [ ] Cart abandon rate tracked
- [ ] Admin order processing time monitored
- [ ] User feedback loop established

---

## 12. Deferred Features (Not in MVP)

Based on E-commerce vs MERN audit, these features are **not** included in this migration:

- Review moderation/admin approval workflow
- Product wishlists / favorites
- Advanced product recommendations
- Inventory management dashboards (stock alerts, forecasting)
- Order notes/communication system
- Multi-warehouse support
- Subscription orders
- Gift cards
- Promotional codes / coupons (backend exists but React UI not built)

These can be prioritized in **Phase 2** if needed.

---

## 13. Reference Architecture

### Frontend Flow (React)

```
App Root
  ├─ App.tsx (session restore on mount via useEffect → GET /auth/status)
  ├─ AppLayout (global banner, nav, footer, cart drawer, auth modal)
  │  ├─ Navbar (search, cart button, auth button, theme toggle)
  │  ├─ CartDrawer (Zustand-driven modal overlay)
  │  ├─ AuthModal (Zustand-driven login/register form)
  │  └─ Routes
  │     ├─ Public: Home, Products, ProductDetail, Search, Cart (page—deprecated), 404
  │     ├─ Protected: Checkout, MyOrders, OrderDetail, MyReviews, MyAddresses
  │     ├─ Admin: Dashboard, Products, Orders, NewProduct
  │
  └─ Global Stores (Zustand)
     ├─ useAuth (user, isLoading, error, login, register, logout)
     ├─ useCart (items, subtotal, tax, etc., add, remove, update, reset)
     ├─ useNotification (toast messages, auto-dismiss)
     └─ useTheme (dark mode, toggle)
```

### Backend API (NestJS)

```
/api
├─ /auth (public)
│  ├─ POST /register
│  ├─ POST /login
│  ├─ POST /logout
│  └─ GET /status
│
├─ /product (public, except ↓)
│  ├─ GET / (list with filters, search, sort, pagination)
│  ├─ GET /deals
│  ├─ GET /:slug (detail + related)
│  ├─ POST (admin only) — create with Cloudinary upload
│  ├─ PATCH /:id (admin only) — edit [NEEDS TO BE ADDED]
│  ├─ DELETE /:id (admin only) [NEEDS TO BE ADDED]
│  └─ PATCH /:id/activate|deactivate (admin only)
│
├─ /cart (guest or auth)
│  ├─ POST / (upsert entire cart)
│  └─ GET / (retrieve cart)
│
├─ /address (auth)
│  ├─ GET / (user's addresses)
│  └─ POST / (create new address)
│
├─ /order (auth)
│  ├─ POST / (create order with address + payment method)
│  ├─ GET / (user's orders)
│  ├─ GET /:id (single order with history)
│  └─ PUT /:id/cancel (cancel order) [NEEDS TO BE ADDED]
│
├─ /review (auth)
│  ├─ POST / (create review)
│  ├─ GET / (user's reviews)
│  ├─ GET /reviewable (eligible order items)
│  └─ GET /product?slug=... (public product reviews)
│
├─ /admin (auth + admin role required)
│  ├─ GET /analytics
│  ├─ GET /products (with pagination, exclude inactive)
│  ├─ GET /orders (with pagination, exclude placed)
│  ├─ PUT /orders/:id/status (update + history)
│  └─ POST /ai/generate (title rephrase, desc generation)
│
└─ /webhook
   └─ POST /stripe (handle payment completion)
```

---

## 14. Key Files to Create/Modify

### React (New/Major)

| File | Purpose | Est. LOC |
|------|---------|---------|
| `src/components/banner.tsx` | Top promo banner | 100 |
| `src/components/nav.tsx` | Navigation bar | 150 |
| `src/components/footer.tsx` | Footer | 80 |
| `src/components/cart-drawer.tsx` | Cart overlay | 200 |
| `src/components/auth-modal.tsx` | Auth overlay | 250 |
| `src/hooks/useSessionRestore.ts` | App init session restore | 50 |
| `src/hooks/useTheme.ts` | Theme toggle store | 80 |
| `src/pages/checkout/index.tsx` | Checkout with accordion | 400 |
| `src/pages/orders/order-tracking.tsx` | Status timeline | 300 |
| `src/pages/admin/orders.tsx` | Admin order mgmt | 300 |
| `src/pages/admin/products.tsx` | Admin product list | 250 |

### NestJS (New Endpoints)

| Endpoint | File | Est. LOC |
|----------|------|---------|
| `PATCH /product/:id` | `product.controller.ts` | 50 |
| `DELETE /product/:id` | `product.service.ts` | 80 |
| `PUT /orders/:id/cancel` | `order.controller.ts` | 60 |
| (Similar service layer) | `order.service.ts` | 150 |

---

## 15. Appendix: Tools & Versions

### Assumed Stack

```
Frontend:
- React 18.x
- TypeScript 5.x
- Vite 5.x
- TanStack Query v5.x
- Zustand 4.x
- Axios 1.x
- React Router v7.x
- React Hook Form 7.x
- Zod 3.x
- Tailwind CSS 3.x
- shadcn/ui (latest)
- Sonner (for toasts)

Backend:
- NestJS 10.x
- TypeScript 5.x
- Mongoose 9.x
- Passport.js (JWT strategy)
- Stripe SDK
- Cloudinary SDK
- Vercel AI SDK (Gemini 2.5 Flash)

Testing:
- Jest (unit)
- React Testing Library (component)
- Playwright or Cypress (E2E)

Deployment:
- Node.js 20.x LTS
- MongoDB Atlas (production)
- Vercel or similar for frontend
- Railway, Render, or AWS for backend
```

---

## 16. Next Steps

1. **Immediate (This Week)**
   - [ ] Review this plan with stakeholders
   - [ ] Create NestJS endpoint issues for backend (edit/delete product, order cancel)
   - [ ] Prioritize quick wins (auth modal, cart drawer)

2. **Short-term (Weeks 1–2)**
   - [ ] Set up React project environment variables
   - [ ] Create layout components (banner, nav, footer)
   - [ ] Implement auth modal + session restore
   - [ ] Build cart drawer

3. **Medium-term (Weeks 3–6)**
   - [ ] Complete checkout flow
   - [ ] Finalize admin interfaces
   - [ ] Write integration tests

4. **Long-term (Weeks 7–10+)**
   - [ ] Polish UI/UX
   - [ ] Performance optimization
   - [ ] Staging & UAT

---

**Document Version:** 1.0  
**Last Updated:** 2025  
**Maintained By:** [Your Name]  
**Status:** Ready for Execution
