# E-Commerce Progress Report

آخر مراجعة: 2026-08-18

هذا الملف يقيس حالة المشروع الفعلية من الكود الموجود، وليس ما هو مذكور في `E-commerce-Final.md` فقط.

## الخلاصة

المشروع بدأ بشكل صحيح من ناحية اختيار التقنية والـ scaffolding:

- Angular standalone في `client`.
- NestJS + Mongoose في `backend`.
- `class-validator` مع `ValidationPipe`.
- JWT داخل httpOnly cookie.
- بداية جيدة لوحدات Auth وCategory وProduct.

لكن المشروع حاليًا في مرحلة **Foundation + بداية Catalog**، وليس في مرحلة feature parity مع الـ blueprint. معظم domains الأساسية مثل Cart وOrders وPayments وReviews وAdmin غير موجودة بعد.

## الحالة الحالية

| الجزء | الحالة | التقييم |
|---|---|---|
| Project setup | مكتمل جزئيًا | Angular وNestJS يعملان كحزمتين منفصلتين |
| NestJS bootstrap | موجود | ConfigModule وMongoose وCORS وcookies وValidationPipe موجودة |
| Auth schema | موجود | User schema، hashing hook، roles، وJWT strategy موجودة |
| Auth API | مكتمل جزئيًا | register/login/logout موجودة، status وcart merge غير موجودين |
| Category API | مكتمل جزئيًا | قراءة التصنيفات النشطة فقط موجودة |
| Product catalog | مكتمل جزئيًا | list/deals/detail/filtering/pagination/create service موجودة |
| Product admin API | غير مكتمل | `createProduct` موجودة في service لكن لا يوجد controller endpoint أو AdminGuard wiring |
| Angular UI | غير مكتمل جدًا | التطبيق ما زال Angular starter ولا توجد routes فعلية |
| Cart | غير منفذ | لا توجد module أو schema أو controller أو service |
| Addresses | غير منفذ | لا توجد module أو schema أو controller أو service |
| Orders / Checkout | غير منفذ | لا توجد order أو checkout implementation |
| Stripe / Payments | غير منفذ | لا يوجد Stripe integration أو webhook |
| Reviews | غير منفذ | لا توجد review implementation |
| Admin analytics/orders | غير منفذ | لا توجد admin module أو endpoints |
| Cloudinary uploads | غير منفذ | لا توجد upload integration |
| AI generation | غير منفذ | لا توجد AI module أو provider |

## ما تم بطريقة صحيحة

### Backend foundation

- `ConfigModule.forRoot({ isGlobal: true })` مفعّل.
- `MongooseModule.forRootAsync` يستخدم `ConfigService` بدل وضع connection string داخل الكود.
- `ValidationPipe` مفعّل مع `whitelist`, `forbidNonWhitelisted`, و`transform`.
- `cookie-parser` مفعّل.
- CORS مهيأ مع `credentials: true`، وهو مناسب لسيناريو JWT cookie.
- الحزم الأساسية المطلوبة لـ NestJS/Mongoose/Passport/class-validator موجودة في `backend/package.json`.

### Authentication

- التسجيل وتسجيل الدخول موجودان.
- كلمة المرور يتم hash لها في `UserSchema` قبل الحفظ.
- كلمة المرور يتم حذفها من JSON output.
- JWT يتم وضعه في cookie باسم `instant_access_token` مع `httpOnly`.
- `JwtStrategy` يعيد تحميل المستخدم من قاعدة البيانات، وهذا يسمح بمنع مستخدم محذوف من الاستمرار بالجلسة.
- `AdminGuard` و`USER_ROLES` موجودان كأساس جيد للصلاحيات.
- DTOs الخاصة بالتسجيل والدخول تستخدم `class-validator`.

### Catalog

- Category schema فيها slug تلقائي باستخدام `slugify`.
- Product schema فيها slug تلقائي وsale price محسوب من السعر والخصم.
- product listing يدعم category وdiscount وstock وprice وkeyword وsort وpagination.
- deals endpoint يفلتر المنتجات النشطة والمتاحة والمخفضة.
- product detail يعيد related products حتى 6 منتجات.
- التحقق من وجود category قبل إنشاء المنتج موجود.
- `ProductModule` يسجل Product وCategory models بشكل صحيح لاستخدامهما في service.

## مشاكل يجب إصلاحها قبل البناء فوقها

### أولوية 1: backend لا يمر في build

الأمر `npm run build` فشل بسبب:

1. [user.schema.ts](backend/src/auth/schemas/user.schema.ts) يستورد roles من `../../common/utils/` بدل `../../common/constants/enums`.
2. `comparePassword` مضافة runtime إلى schema methods، لكنها غير معرفة في TypeScript type الخاص بـ `UserDocument`، لذلك `auth.service.ts` لا يراها.
3. `JWT_SECRET` في `jwt.strategy.ts` نوعه `string | undefined` بينما Passport يحتاج قيمة مؤكدة.
4. حذف `ret.password` داخل transform لا يتوافق مع النوع المستنتج حاليًا، وسيحتاج typing مناسب للـ transform.

هذه ليست ملاحظات تجميلية؛ يجب إصلاحها حتى يصبح backend قابلًا للـ compile.

### أولوية 2: الاختبارات الحالية غير مضبوطة

الأمر `npm test -- --runInBand` فشل في اختبارات Category وProduct لأن الـ specs تنشئ controller/service بدون توفير dependencies:

- لا يوجد mock لـ `CategoryService` داخل category controller spec.
- لا يوجد mock لـ `ProductService` داخل product controller spec.
- لا يوجد mock لـ `CategoryModel` داخل category service spec.
- لا يوجد mock لـ `ProductModel` و`CategoryModel` داخل product service spec.

الاختبارات الحالية تختبر التعريف فقط، ولا تختبر business behavior مثل filtering أو pricing أو validation. بعد إصلاح DI يجب إضافة اختبارات سلوك حقيقية.

### أولوية 3: API الحالي لا يطابق الوثيقة

الوثيقة توصف endpoints مثل `/api/products` و`/api/categories`، لكن الكود الحالي يستخدم:

- `/product`
- `/category`
- `/auth`

ولا يوجد `app.setGlobalPrefix('api')` في `main.ts`. يجب اختيار convention واحد وتثبيته قبل بناء Angular API services.

### أولوية 4: Auth غير مكتمل

- لا يوجد `GET /auth/status`.
- لا يوجد guest cart أو cart merge عند التسجيل/الدخول.
- `JwtAuthGuard` و`AdminGuard` موجودان لكن لا توجد routes محمية تستخدمهما فعليًا حتى الآن.
- لا يوجد global exception filter أو response interceptor يحافظ على envelope موحد مثل الوثيقة.
- لا يوجد env validation، و`JWT_SECRET` لا يتم fail-fast عند بدء التطبيق.

### أولوية 5: Product creation غير موصول

الدالة `createProduct` موجودة داخل [product.service.ts](backend/src/product/product.service.ts)، لكن [product.controller.ts](backend/src/product/product.controller.ts) لا يحتوي endpoint لإنشاء المنتج، ولا يوجد `@UseGuards(JwtAuthGuard, AdminGuard)` حول endpoint إداري.

## فروقات مع القرارات النهائية في blueprint

- القرار الخاص بـ feature modules تحت `src/modules/` لم يُطبق بعد؛ الوحدات الحالية مباشرة تحت `src/auth`, `src/category`, و`src/product`.
- Angular standalone مطبق، لكن lazy routes والـ feature folders والـ guards والخدمات لم تُبنَ بعد.
- لا توجد Signals/services للـ auth أو cart حتى الآن.
- لا توجد shared/core/layout layers في Angular.
- لا يوجد `/api` prefix أو response/error contract موحد.

هذه الفروقات ليست مشكلة طالما أن المشروع ما زال في البداية، لكنها تعني أن الوثيقة حاليًا roadmap وليست وصفًا دقيقًا للحالة التنفيذية.

## ترتيب العمل المقترح الآن

1. إصلاح أخطاء TypeScript في User schema وJWT strategy حتى ينجح `npm run build`.
2. إصلاح test DI بإضافة mocks، ثم كتابة اختبارات حقيقية لـ auth وprice calculation وproduct filters.
3. تثبيت API convention: يفضل إضافة `/api` واستخدام أسماء الجمع مثل `/products` و`/categories` قبل بدء Angular services.
4. إكمال Auth: status endpoint، decorator للمستخدم الحالي، ثم حماية admin routes.
5. إضافة Cart مع server-authoritative totals وstock clamping.
6. إضافة Addresses ثم Orders/Checkout، وبعدها Payments وStripe webhook.
7. إضافة Reviews وAdmin APIs وCloudinary وAI.
8. بناء Angular shell والـ routes والـ AuthSessionService بعد استقرار auth contract.

## نتائج التحقق

- `client`: الأمر `npm run build` نجح.
- `backend`: الأمر `npm run build` فشل بسبب أخطاء TypeScript المذكورة أعلاه.
- `backend`: الأمر `npm test -- --runInBand` فشل بسبب dependencies غير موفرة في test modules.

## معيار الانتقال للمرحلة التالية

لا تعتبر مرحلة Auth/Catalog مكتملة إلا بعد تحقق الثلاثة التالية:

- `backend npm run build` ينجح.
- `backend npm test -- --runInBand` ينجح.
- يوجد اختبار HTTP أو service behavior لكل قاعدة مهمة، وليس اختبار `defined` فقط.
