# NestJS E-Commerce Backend - Comprehensive Audit

## 1. Authentication & JWT Implementation

### JWT Strategy Configuration
The JWT strategy is implemented using Passport.js with cookie-based token storage:

```typescript
// src/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      // Extracts JWT from cookies
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.instant_access_token ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // From JWT_SECRET env var
      audience: ['user'], // JWT must have 'user' audience
    });
  }

  async validate(payload: { userId: string }) {
    const user = await this.authService.findUserById(payload.userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

### Token Generation & Cookie Configuration
Tokens are created in the auth controller with secure cookie settings:

```typescript
// src/auth/auth.controller.ts - Register/Login endpoints
const token = jwt.sign(
  { userId: user._id.toString() },
  ENV.JWT_SECRET!,
  {
    audience: ['user'],
    expiresIn: '7d', // 7-day expiration
  },
);

res.cookie('instant_access_token', token, {
  httpOnly: true, // ✅ Prevents XSS attacks
  secure: ENV.NODE_ENV === 'production', // ✅ HTTPS only in production
  sameSite: ENV.NODE_ENV === 'production' ? 'strict' : 'lax', // ✅ CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

### Password Hashing
Uses bcryptjs with 10 salt rounds (secure):

```typescript
// src/common/utils/bcrypt.util.ts
export const hashValue = async (value: string, saltRounds = 10): Promise<string> => {
  return bcrypt.hash(value, saltRounds);
};

// Applied in User schema pre-save hook
UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await hashValue(this.password);
  }
});

// Password comparison method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> => {
  return compareValue(candidatePassword, this.password);
};
```

### Auth Service Methods
```typescript
// src/auth/auth.service.ts
async register(data: RegisterDto) {
  const existingUser = await this.userModel.findOne({ email: data.email });
  if (existingUser) {
    throw new BadRequestException('Email already in use');
  }
  const user = await this.userModel.create(data); // Password hashed by schema hook
  return user.toJSON(); // Automatically excludes password
}

async login(data: LoginDto) {
  const user = await this.userModel
    .findOne({ email: data.email })
    .select('+password'); // Explicitly include password field
  if (!user) {
    throw new UnauthorizedException('Invalid email or password');
  }
  const isMatch = await user.comparePassword(data.password);
  if (!isMatch) {
    throw new UnauthorizedException('Invalid email or password');
  }
  return user.toJSON();
}
```

---

## 2. Role-Based Access Control (RBAC)

### User Roles Definition
```typescript
// src/common/constants/enums.ts
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export const USER_ROLE_VALUES = Object.values(USER_ROLES);
```

### Roles Decorator
```typescript
// src/auth/decorators/roles.decorator.ts
export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

### RolesGuard Implementation
```typescript
// src/auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role restriction
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission');
    }

    return true;
  }
}
```

### AdminGuard (Simplified Version)
```typescript
// src/auth/guards/admin.guard.ts
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    if (!user || user.role !== USER_ROLES.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
```

### Guard Usage in Controllers
```typescript
// src/product/product.controller.ts - Admin-only product creation
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLES.ADMIN)
async createProduct(
  @UploadedFile() file: Express.Multer.File,
  @Body() body: CreateProductDto,
  @Req() req: Request,
) {
  // Only admins can create products
}

// src/order/order.controller.ts - Admin-only order management
@Get('admin/all')
@Roles(USER_ROLES.ADMIN)
@UseGuards(RolesGuard)
async getAllOrdersForAdmin(@Query() query: GetAdminOrdersDto) {
  // Only admins can view all orders
}
```

---

## 3. Key Business Logic Summary

### **Auth Service**
- User registration with duplicate email check
- Secure login with password validation
- JWT token generation and validation
- User lookup by ID

### **Product Service**
- CRUD operations for products
- Advanced filtering (category, price range, stock status, discount)
- Keyword search with regex escaping
- Slug auto-generation from product names
- Discount price calculation
- Image upload to Cloudinary
- Stock management

### **Cart Service**
- Guest cart and user cart management
- Cart upsert with product validation
- Automatic stock quantity limiting
- Guest-to-user cart merging on login
- Cart total calculations (subtotal, delivery fee, tax)

### **Order Service**
- Order creation from cart items
- Address validation
- Order number generation
- Payment method handling (Cash on Delivery + Stripe)
- Stock deduction after payment
- Order status tracking with history
- Admin order management

### **Review Service**
- Review eligibility validation (order must be delivered and paid)
- Duplicate review prevention
- Rating aggregation to product
- Transaction-based consistency (uses MongoDB sessions)

### **AI Service**
- Integration with Google Gemini 2.5 Flash Lite
- Product title rephrasing
- Product description generation
- Admin-only features

---

## 4. DTO Validation Rules

### Authentication DTOs
```typescript
// src/auth/dto/register.dto.ts
export class RegisterDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string; // Email uniqueness checked in service

  @IsString()
  @MinLength(6)
  password: string; // Minimum 6 characters

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

// src/auth/dto/login.dto.ts
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}
```

### Product DTOs
```typescript
// src/product/dto/create-product.dto.ts
export class CreateProductDto {
  @IsMongoId()
  categoryId: string; // Must be valid ObjectId

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  originalPrice: number; // Must be >= 0

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number; // 0-100 range

  @IsOptional()
  @IsString()
  discountLabel?: string;

  @IsOptional()
  @IsString()
  unit?: string; // e.g., 'pc', 'kg', 'liter'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockCount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

### Order DTOs
```typescript
// src/order/dto/create-order.dto.ts
export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  addressId: string; // Must exist and belong to user

  @IsString()
  @IsIn(PAYMENT_METHOD_VALUES)
  paymentMethod: string; // 'card' or 'cash_on_delivery'
}
```

### Cart DTOs
```typescript
// src/cart/dto/upsert-cart.dto.ts
export class CartItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number; // Minimum 1 item
}

export class UpsertCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}
```

### Review DTOs
```typescript
// src/review/dto/create-review.dto.ts
export class CreateReviewDto {
  @IsMongoId()
  orderId: string;

  @IsMongoId()
  orderItemId: string; // Specific item in the order

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number; // 1-5 star rating

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
```

---

## 5. Mongoose Schema Definitions

### **User Schema**
```typescript
// src/auth/schemas/user.schema.ts
@Schema({ timestamps: true, toJSON: { transform: (doc, ret) => delete ret.password } })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, minlength: 6, select: false })
  password: string; // Hidden by default, only retrieved with .select('+password')

  @Prop({ type: String, enum: USER_ROLE_VALUES, default: USER_ROLES.USER })
  role: UserRole; // 'user' or 'admin'

  @Prop({ type: String, default: undefined })
  phone?: string;

  @Prop({ type: String, default: undefined })
  avatar?: string;
}
// Indexes: email (unique), role
// Hooks: password hashing on save
```

### **Product Schema**
```typescript
// src/product/schemas/product.schema.ts
export class ProductImage {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  publicId: string; // Cloudinary public ID for deletion
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string; // Auto-generated from name

  @Prop({ type: String, default: undefined })
  description?: string;

  @Prop({ type: [ProductImageSchema], default: [] })
  images: ProductImage[];

  @Prop({ required: true, min: 0 })
  originalPrice: number;

  @Prop({ default: 0 })
  salePrice: number; // Auto-calculated from discount

  @Prop({ default: 0, min: 0, max: 100 })
  discountPercent: number;

  @Prop({ type: String, default: undefined })
  discountLabel?: string;

  @Prop({ default: 'pc' })
  unit: string;

  @Prop({ default: 0, min: 0 })
  stockCount: number;

  @Prop({ default: 0, min: 0, max: 5 })
  ratingAverage: number; // Updated by review service

  @Prop({ default: 0, min: 0 })
  reviewCount: number;

  @Prop({ default: true })
  isActive: boolean;
}
// Hooks: Auto-slug generation, salePrice calculation
```

### **Cart Schema**
```typescript
// src/cart/schemas/cart.schema.ts
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, default: 1 })
  quantity: number;
}

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId | null; // User cart or guest cart

  @Prop({ type: String, default: null })
  guestCartId: string | null; // Temporary guest ID

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];
}
```

### **Order Schema**
```typescript
// src/order/schemas/order.schema.ts
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: Number, required: true })
  originalPrice: number;

  @Prop({ type: Number, required: true, default: 0 })
  discountPercent: number;

  @Prop({ type: Number, required: true })
  salePrice: number; // Price at time of purchase

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Boolean, default: false })
  isReviewed: boolean; // Track if customer reviewed this item
}

export class OrderAddress {
  @Prop({ type: String, required: true })
  recipientName: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, required: true })
  street: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: true })
  state: string;

  @Prop({ type: String, required: true })
  postalCode: string;

  @Prop({ type: String, required: true })
  country: string;
}

export class OrderStatusHistory {
  @Prop({ type: String, enum: ORDER_STATUS_VALUES, required: true })
  status: OrderStatus;

  @Prop({ type: String, default: '' })
  note: string;

  @Prop({ type: Date, default: Date.now })
  date: Date;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  orderNo: string; // Unique order number

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ type: OrderAddressSchema, required: true })
  shippingAddress: OrderAddress;

  @Prop({ type: String, enum: PAYMENT_METHOD_VALUES, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ type: String, enum: PAYMENT_STATUS_VALUES, default: PAYMENT_STATUS.PENDING })
  paymentStatus: PaymentStatus; // pending, paid, failed, refunded

  @Prop({ type: String, enum: ORDER_STATUS_VALUES, default: ORDER_STATUS.PLACED })
  status: OrderStatus; // placed, confirmed, assigned, packed, out_for_delivery, delivered, cancelled

  @Prop({ type: [OrderStatusHistorySchema], default: [{ status: ORDER_STATUS.PLACED, date: new Date() }] })
  statusHistory: OrderStatusHistory[];

  @Prop({ type: String, unique: true, sparse: true })
  stripeSessionId?: string;

  @Prop({ type: String, default: null })
  stripePaymentIntentId?: string;

  @Prop({ type: Date, default: null })
  paidAt?: Date;

  @Prop({ type: Boolean, default: false })
  stockDeducted: boolean;

  @Prop({ type: Number, required: true })
  subtotal: number;

  @Prop({ type: Number, required: true, default: 0 })
  deliveryFee: number;

  @Prop({ type: Number, required: true })
  tax: number;

  @Prop({ type: Number, required: true })
  total: number;
}
```

### **Review Schema**
```typescript
// src/review/schemas/review.schema.ts
@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, unique: true })
  orderItemId: Types.ObjectId; // Ensures one review per item

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String, default: undefined })
  comment?: string;
}
// Indexes: orderItemId (unique), productId
```

### **Other Schemas**
```typescript
// src/category/schemas/category.schema.ts
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ type: CategoryImageSchema, default: null })
  image: CategoryImage | null;

  @Prop({ type: String, default: undefined })
  description?: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

// src/address/schemas/address.schema.ts
@Schema({ timestamps: true })
export class Address {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  recipientName: string;

  @Prop({ type: String, required: true, trim: true })
  phone: string;

  @Prop({ type: String, required: true, trim: true })
  street: string;

  @Prop({ type: String, required: true, trim: true })
  city: string;

  @Prop({ type: String, required: true, trim: true })
  state: string;

  @Prop({ type: String, required: true, trim: true })
  postalCode: string;

  @Prop({ type: String, required: true, trim: true })
  country: string;
}
```

---

## 6. Cart Management

### Guest vs. User Cart
```typescript
// src/cart/cart.service.ts
async upsertCart(
  userId: string | null,
  guestCartId: string | null,
  data: UpsertCartDto,
) {
  // Requires either userId or guestCartId
  if (!userId && !guestCartId) {
    throw new BadRequestException('User ID or guest cart ID is required');
  }

  // Build query based on user type
  const query: Record<string, unknown> = userId
    ? { userId: new Types.ObjectId(userId) }
    : { guestCartId }; // Guest cart lookup

  // Validate and filter products
  const validItems: { productId: Types.ObjectId; quantity: number }[] = [];

  for (const item of data.items) {
    if (!item.productId || !Types.ObjectId.isValid(item.productId)) {
      continue; // Skip invalid IDs
    }
    validItems.push({
      productId: new Types.ObjectId(item.productId),
      quantity: item.quantity,
    });
  }

  // Fetch active products from DB
  const products = await this.productModel
    .find({
      _id: { $in: validItems.map((item) => item.productId) },
      isActive: true, // Only active products
    })
    .select('name slug images salePrice originalPrice discountPercent stockCount')
    .lean();

  const productMap = new Map(
    products.map((product) => [product._id.toString(), product]),
  );

  // Limit quantity to available stock
  const filteredItems: { productId: Types.ObjectId; quantity: number }[] = [];
  for (const item of validItems) {
    const product = productMap.get(item.productId.toString());
    if (!product) continue;

    filteredItems.push({
      productId: item.productId,
      quantity: Math.min(item.quantity, product.stockCount), // Cap at stock
    });
  }

  // Upsert cart
  const update: Record<string, unknown> = {
    $set: { items: filteredItems },
  };

  // Remove guestCartId when user logs in
  if (userId) {
    update.$unset = { guestCartId: '' };
  }

  const cart = await this.cartModel.findOneAndUpdate(query, update, {
    upsert: true, // Create if doesn't exist
    new: true,
  }).populate({
    path: 'items.productId',
    select: 'name slug images salePrice originalPrice discountPercent stockCount',
  });

  const totals = calculateCartTotals(populatedItems);
  return { cart, ...totals };
}
```

### Cart Merge on Login
```typescript
async mergeGuestCart(userId: string, guestCartId: string | null) {
  if (!guestCartId) return;

  const guestCart = await this.cartModel.findOne({ guestCartId });
  if (!guestCart || guestCart.items.length === 0) return;

  const userObjectId = new Types.ObjectId(userId);
  const userCart = await this.cartModel.findOne({ userId: userObjectId });

  // Case 1: User has no existing cart
  if (!userCart) {
    await this.cartModel.updateOne(
      { guestCartId },
      {
        $set: { userId: userObjectId, guestCartId: null },
      },
    );
    return;
  }

  // Case 2: User has existing cart - merge items
  // Merge logic combines guest items with user cart items
  const mergedItems = [...userCart.items];
  for (const guestItem of guestCart.items) {
    const existingIndex = mergedItems.findIndex(
      (item) => item.productId.toString() === guestItem.productId.toString(),
    );

    if (existingIndex >= 0) {
      mergedItems[existingIndex].quantity += guestItem.quantity;
    } else {
      mergedItems.push(guestItem);
    }
  }

  await this.cartModel.updateOne(
    { userId: userObjectId },
    { $set: { items: mergedItems } },
  );

  // Delete guest cart
  await this.cartModel.deleteOne({ guestCartId });
}
```

### Cart Calculations
```typescript
// src/common/utils/cart.util.ts
export function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((acc, item) => {
    return acc + item.productId.salePrice * item.quantity;
  }, 0);

  // Free delivery over $20
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  // Tax calculation (8%)
  const tax = (subtotal + deliveryFee) * TAX_RATE;

  const orderTotal = subtotal + deliveryFee + tax;

  return {
    subtotal,
    deliveryFee,
    tax,
    orderTotal,
  };
}
```

---

## 7. Order Workflow

### Order Creation Flow
```typescript
// src/order/order.service.ts
async createOrder(userId: string, data: CreateOrderDto) {
  // 1. Validate cart exists and has items
  const cart = await this.cartModel
    .findOne({ userId: new Types.ObjectId(userId) })
    .populate({
      path: 'items.productId',
      select: 'name slug images originalPrice discountPercent salePrice stockCount',
    });

  if (!cart || !cart.items || cart.items.length === 0) {
    throw new BadRequestException('Cart is empty');
  }

  // 2. Validate address
  const address = await this.addressModel.findOne({
    _id: data.addressId,
    userId: new Types.ObjectId(userId),
  });

  if (!address) {
    throw new NotFoundException('Address not found');
  }

  // 3. Create order items snapshot
  const orderItems = items.map((item) => ({
    productId: item.productId._id,
    name: item.productId.name,
    image: item.productId.images?.[0]?.url ?? '',
    originalPrice: item.productId.originalPrice,
    discountPercent: item.productId.discountPercent,
    salePrice: item.productId.salePrice,
    quantity: item.quantity,
    isReviewed: false,
  }));

  const shippingAddress = {
    recipientName: address.recipientName,
    phone: address.phone,
    street: address.street,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  };

  const totals = calculateCartTotals(items);

  // 4. Create order
  const order = await this.orderModel.create({
    userId: new Types.ObjectId(userId),
    orderNo: generateOrderNo(), // Unique order number
    items: orderItems,
    shippingAddress,
    paymentMethod: data.paymentMethod,
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    tax: totals.tax,
    total: totals.orderTotal,
  });

  // 5a. Cash on Delivery - Immediate stock deduction
  if (data.paymentMethod === PAYMENT_METHODS.CASH_ON_DELIVERY) {
    await this.cartModel.deleteOne({
      userId: new Types.ObjectId(userId),
    });

    await Promise.all(
      items.map((item) =>
        this.productModel.findByIdAndUpdate(item.productId._id, {
          $inc: { stockCount: -item.quantity },
        }),
      ),
    );

    order.stockDeducted = true;
    await order.save();

    return { order, stripeUrl: null };
  }

  // 5b. Card Payment - Create Stripe session
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    orderItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.salePrice * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }));

  // Add delivery fee and tax as line items
  if (totals.deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Delivery Fee' },
        unit_amount: Math.round(totals.deliveryFee * 100),
      },
      quantity: 1,
    });
  }

  if (totals.tax > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Tax' },
        unit_amount: Math.round(totals.tax * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripeClient.checkout.sessions.create({
    line_items: lineItems,
    mode: 'payment',
    success_url: `${ENV.FRONTEND_ORIGIN}/success?orderId=${order._id}`,
    cancel_url: `${ENV.FRONTEND_ORIGIN}/cancel`,
  });

  order.stripeSessionId = session.id;
  await order.save();

  return { order, stripeUrl: session.url };
}
```

### Order Status Transitions
```typescript
// src/common/constants/enums.ts
export const ORDER_STATUS = {
  PLACED: 'placed',           // Initial state
  CONFIRMED: 'confirmed',     // Payment confirmed
  ASSIGNED: 'assigned',       // Assigned to delivery partner
  PACKED: 'packed',           // Items packed
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',     // Final state
  CANCELLED: 'cancelled',     // Cancelled
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Status history is tracked with timestamps and notes
statusHistory: OrderStatusHistory[] = [
  { status: ORDER_STATUS.PLACED, date: new Date() },
  // Admin can add more status transitions with notes
];
```

---

## 8. Review System

### Review Eligibility & Validation
```typescript
// src/review/review.service.ts
async createReview(userId: string, data: CreateReviewDto) {
  const { orderId, orderItemId, rating, comment } = data;

  // 1. Validate order exists and belongs to user
  const order = await this.orderModel.findOne({
    _id: orderId,
    userId,
  });

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  // 2. Verify order is delivered AND paid (eligibility check)
  if (
    order.status !== ORDER_STATUS.DELIVERED ||
    order.paymentStatus !== PAYMENT_STATUS.PAID
  ) {
    throw new BadRequestException(
      'Order must be delivered and paid to leave a review',
    );
  }

  // 3. Find order item
  const orderItem = order.items.find(
    (item) => item._id?.toString() === orderItemId,
  );

  if (!orderItem) {
    throw new NotFoundException('Order item not found in this order');
  }

  // 4. Prevent duplicate reviews (one review per order item)
  const existingReview = await this.reviewModel.findOne({
    orderItemId,
  });

  if (existingReview) {
    throw new BadRequestException('You have already reviewed this item');
  }

  // 5. Create review with transaction
  const session = await this.reviewModel.db.startSession();

  try {
    const review = await session.withTransaction(async () => {
      // Create review
      const [createdReview] = await this.reviewModel.create(
        [
          {
            userId,
            orderId,
            orderItemId,
            productId: orderItem.productId,
            rating,
            comment,
          },
        ],
        { session },
      );

      // Mark item as reviewed
      const updateOrderResult = await this.orderModel.updateOne(
        {
          _id: orderId,
          'items._id': orderItemId,
          'items.isReviewed': false,
        },
        {
          $set: { 'items.$.isReviewed': true },
        },
        { session },
      );

      // 6. Calculate and update product rating
      const [aggResult] = await this.reviewModel
        .aggregate([
          { $match: { productId: orderItem.productId } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
            },
          },
        ])
        .session(session);

      const newAverage =
        aggResult?.averageRating != null
          ? Math.round(aggResult.averageRating * 10) / 10
          : 0;

      const newCount = aggResult?.totalReviews ?? 0;

      // Update product with new average rating
      await this.productModel.updateOne(
        { _id: orderItem.productId },
        {
          $set: {
            ratingAverage: newAverage,
            reviewCount: newCount,
          },
        },
        { session },
      );

      return createdReview;
    });

    return review;
  } finally {
    await session.endSession();
  }
}
```

### Key Features
- ✅ Only eligible orders can be reviewed (delivered + paid)
- ✅ One review per order item (duplicate prevention via unique `orderItemId`)
- ✅ Rating aggregation to product (average rating + count)
- ✅ Uses MongoDB transactions for data consistency
- ✅ Tracks review status on order items (`isReviewed` flag)

---

## 9. Error Handling

### Custom Error Classes
```typescript
// src/common/errors/app-error.ts
export const ErrorCodes = {
  ERR_INTERNAL: 'ERR_INTERNAL',
  ERR_BAD_REQUEST: 'ERR_BAD_REQUEST',
  ERR_UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  ERR_FORBIDDEN: 'ERR_FORBIDDEN',
  ERR_NOT_FOUND: 'ERR_NOT_FOUND',
  ERR_VALIDATION: 'ERR_VALIDATION',
} as const;

export class AppError extends HttpException {
  public readonly errorCode: ErrorCodeType;

  constructor(message: string, statusCode: number, errorCode: ErrorCodeType) {
    super(
      {
        message,
        errorCode, // Structured error response
      },
      statusCode,
    );
    this.errorCode = errorCode;
  }
}

// Specialized error classes
export class BadRequestException extends AppError {
  constructor(message = 'Bad Request') {
    super(message, HttpStatus.BAD_REQUEST, ErrorCodes.ERR_BAD_REQUEST);
  }
}

export class UnauthorizedException extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCodes.ERR_UNAUTHORIZED);
  }
}

export class ForbiddenException extends AppError {
  constructor(message = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN, ErrorCodes.ERR_FORBIDDEN);
  }
}

export class NotFoundException extends AppError {
  constructor(message = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND, ErrorCodes.ERR_NOT_FOUND);
  }
}

export class InternalServerException extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.ERR_INTERNAL);
  }
}
```

### Error Handling Patterns Used

**1. Validation Errors**
```typescript
if (!file) {
  throw new BadRequestException('Image file is missing');
}

if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
  throw new BadRequestException('Image size must not exceed 5MB');
}
```

**2. Resource Not Found**
```typescript
const user = await this.userModel.findOne({ email: data.email });
if (!user) {
  throw new UnauthorizedException('Invalid email or password');
}

const order = await this.orderModel.findOne({ _id: orderId, userId });
if (!order) {
  throw new NotFoundException('Order not found');
}
```

**3. Authorization Errors**
```typescript
if (!requiredRoles.includes(user.role)) {
  throw new ForbiddenException('You do not have permission');
}
```

**4. Business Logic Errors**
```typescript
if (existingUser) {
  throw new BadRequestException('Email already in use');
}

if (order.status !== ORDER_STATUS.DELIVERED) {
  throw new BadRequestException('Order must be delivered to leave a review');
}
```

**5. Transaction Errors**
```typescript
const [createdReview] = await this.reviewModel.create([...], { session });
if (!createdReview) {
  throw new BadRequestException('Failed to create review');
}
```

---

## 10. Security Concerns & Recommendations

### ✅ Implemented Security Measures

1. **Password Security**
   - ✅ bcryptjs with 10 salt rounds
   - ✅ Password excluded from JSON responses
   - ✅ `.select('+password')` required to access password field

2. **JWT Security**
   - ✅ httpOnly cookies (prevents XSS)
   - ✅ Secure flag in production (HTTPS only)
   - ✅ SameSite cookie attribute (CSRF protection)
   - ✅ 7-day token expiration
   - ✅ JWT audience validation ('user')

3. **Authorization**
   - ✅ RolesGuard for role-based access control
   - ✅ User ownership verification for resources
   - ✅ Address validation belongs to user before order creation

4. **Input Validation**
   - ✅ DTOs with class-validator
   - ✅ Email format validation
   - ✅ MongoId validation
   - ✅ Min/Max constraints on numbers
   - ✅ Enum validation for payment methods

5. **Data Integrity**
   - ✅ MongoDB transactions for critical operations (reviews, orders)
   - ✅ Unique constraints (email, product slug, order number)
   - ✅ Mongoose schema validation

6. **File Upload Security**
   - ✅ File type validation (JPEG, PNG, WebP only)
   - ✅ File size limits (5MB max)
   - ✅ Dynamic file-type detection

### ⚠️ Potential Security Issues & Recommendations

#### 1. **CORS Configuration Not Visible**
```typescript
// Consider adding CORS middleware in main.ts
app.enableCors({
  origin: ENV.FRONTEND_ORIGIN, // Restrict to frontend domain
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
});
```

#### 2. **Rate Limiting Missing**
```typescript
// Recommendation: Add rate limiting to auth endpoints
// npm install @nestjs/throttler
import { ThrottlerModule } from '@nestjs/throttler';

// In AppModule
ThrottlerModule.forRoot([
  {
    ttl: 60000, // 1 minute
    limit: 5, // 5 requests per minute
  },
]);

// On endpoints
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('register')
async register(...) { }
```

#### 3. **Environment Variable Validation**
```typescript
// Current: Throws error if env vars missing (good)
// Could be improved with schema validation
// npm install joi
import * as Joi from 'joi';

ConfigModule.forRoot({
  validationSchema: Joi.object({
    JWT_SECRET: Joi.string().required(),
    MONGO_URI: Joi.string().required(),
    NODE_ENV: Joi.string().valid('development', 'production').required(),
  }),
});
```

#### 4. **SQL/NoSQL Injection Prevention**
✅ **Good**: Using Mongoose ODM prevents NoSQL injection
```typescript
// ✅ Safe: Mongoose handles parameterization
await this.userModel.findOne({ email: data.email });

// ✅ Safe: ObjectId validation before queries
if (!Types.ObjectId.isValid(categoryId)) {
  throw new BadRequestException('Invalid category ID');
}

// ✅ Safe: Regex escaping for keyword search
const escapedKeyword = escapeRegex(keyword.trim());
filter.$or = [{ name: { $regex: escapedKeyword, ... } }];
```

#### 5. **Missing Audit Logging**
```typescript
// Recommendation: Log sensitive operations
// Create audit service for:
// - Failed login attempts
// - Admin actions (product creation, order status changes)
// - Review creation
// - Payment transactions
```

#### 6. **Stripe Webhook Security**
```typescript
// Ensure webhook verification is implemented
// src/webhooks/stripe-webhook.controller.ts should verify:
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.body,
  sig,
  ENV.STRIPE_WEBHOOK_SECRET,
);
// Only then trust event data
```

#### 7. **API Key Exposure in Errors**
```typescript
// ✅ Good: Cloudinary errors are caught
// Recommendation: Log internally but don't expose to client
try {
  await uploadImageToCloudinary(file);
} catch (error) {
  // Don't expose internal error details
  throw new InternalServerException('Image upload failed');
}
```

#### 8. **Missing Input Sanitization**
```typescript
// Recommendation: Add global validation pipe
// in main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Remove extra properties
    forbidNonWhitelisted: true, // Reject extra properties
    transform: true, // Auto-transform types
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

#### 9. **Payment Intent Not Fully Implemented**
```typescript
// Current: Creates Stripe session but doesn't complete payment flow
// Recommendation: Implement webhook handler for:
// - checkout.session.completed -> mark order as paid
// - payment_intent.payment_failed -> update order status
// - payment_intent.canceled -> handle refund
```

#### 10. **Token Refresh Missing**
```typescript
// Current: 7-day fixed expiration without refresh tokens
// Recommendation: Implement refresh token strategy
// Add refresh_token to user session
// Implement /auth/refresh endpoint
// Rotate tokens on each refresh for security
```

#### 11. **Missing HTTPS Redirect in Production**
```typescript
// Recommendation: Add HTTP -> HTTPS redirect
app.use((req, res, next) => {
  if (ENV.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});
```

#### 12. **Insufficient Cart Validation on Merge**
```typescript
// Current: Merges guest cart without re-validating stock
// Recommendation: Re-validate all items when merging
async mergeGuestCart(userId: string, guestCartId: string) {
  // Re-check stock levels before merging
  // Remove out-of-stock items
  // Adjust quantities if needed
}
```

---

## Summary

### Strengths
- ✅ Clean architecture with clear separation of concerns
- ✅ Comprehensive DTOs with validation
- ✅ Proper use of NestJS guards and decorators
- ✅ Transaction support for critical operations
- ✅ Secure password hashing (bcryptjs)
- ✅ HTTPOnly, Secure, SameSite cookies
- ✅ Role-based access control
- ✅ Input validation with class-validator
- ✅ Proper error handling with custom error classes

### Areas for Improvement
1. Add CORS configuration
2. Implement rate limiting on auth endpoints
3. Add environment validation with Joi
4. Implement comprehensive audit logging
5. Complete Stripe webhook implementation
6. Add refresh token mechanism
7. Implement global validation pipe
8. Add input sanitization
9. Implement HTTPS redirect
10. Better stock validation during cart merge

This backend provides a solid foundation for an e-commerce platform with good security practices already in place!
