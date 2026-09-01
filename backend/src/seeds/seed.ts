import mongoose from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  phone?: string;
  avatar?: string;
}

interface Category {
  _id?: string;
  name: string;
  slug: string;
  image?: {
    url: string;
    publicId: string;
  } | null;
  description?: string;
  isActive: boolean;
}

interface ProductImage {
  url: string;
  publicId: string;
}

interface Product {
  _id?: string;
  userId: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  images: ProductImage[];
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  discountLabel?: string;
  unit: string;
  stockCount: number;
  ratingAverage: number;
  reviewCount: number;
  isActive: boolean;
}

interface OrderItem {
  _id?: string;
  productId: string;
  name: string;
  image: string;
  originalPrice: number;
  discountPercent: number;
  salePrice: number;
  quantity: number;
  isReviewed: boolean;
}

interface OrderAddress {
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface OrderStatusHistory {
  status: string;
  note?: string;
  date: Date;
}

interface Order {
  _id?: string;
  userId: string;
  orderNo: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  statusHistory: OrderStatusHistory[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get collections
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection failed');
    }

    // Drop existing collections
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.dropCollection(collection.name);
    }
    console.log('Cleared existing data');

    // Create Users
    const admin: User = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: await bcryptjs.hash('password123', 10),
      role: 'admin',
      phone: '+1-555-0101',
    };

    const customers: User[] = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: await bcryptjs.hash('password123', 10),
        role: 'user',
        phone: '+1-555-0102',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: await bcryptjs.hash('password123', 10),
        role: 'user',
        phone: '+1-555-0103',
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        password: await bcryptjs.hash('password123', 10),
        role: 'user',
        phone: '+1-555-0104',
      },
      {
        name: 'Alice Brown',
        email: 'alice@example.com',
        password: await bcryptjs.hash('password123', 10),
        role: 'user',
        phone: '+1-555-0105',
      },
    ];

    const usersCollection = db.collection('users');
    const adminResult = await usersCollection.insertOne(admin as any);
    const customersResult = await usersCollection.insertMany(customers as any);

    const adminId = adminResult.insertedId.toString();
    const customerIds = Object.values(customersResult.insertedIds).map((id) => id.toString());

    console.log(`Created ${customerIds.length + 1} users`);

    // Create Categories
    const categories: Category[] = [
      {
        name: 'Fresh Produce',
        slug: 'fresh-produce',
        description: 'Fresh fruits and vegetables',
        image: {
          url: 'https://images.unsplash.com/photo-1488459716781-8d54d7d299c3?w=500&h=500&fit=crop',
          publicId: 'ecommerce/categories/produce',
        },
        isActive: true,
      },
      {
        name: 'Dairy & Eggs',
        slug: 'dairy-eggs',
        description: 'Milk, cheese, yogurt, and eggs',
        image: {
          url: 'https://images.unsplash.com/photo-1452195745677-fc0314a14b00?w=500&h=500&fit=crop',
          publicId: 'ecommerce/categories/dairy',
        },
        isActive: true,
      },
      {
        name: 'Bakery',
        slug: 'bakery',
        description: 'Fresh bread and baked goods',
        image: {
          url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=500&fit=crop',
          publicId: 'ecommerce/categories/bakery',
        },
        isActive: true,
      },
      {
        name: 'Beverages',
        slug: 'beverages',
        description: 'Coffee, tea, juice, and drinks',
        image: {
          url: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&h=500&fit=crop',
          publicId: 'ecommerce/categories/beverages',
        },
        isActive: true,
      },
      {
        name: 'Snacks',
        slug: 'snacks',
        description: 'Chips, nuts, and snack foods',
        image: {
          url: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd68fcc?w=500&h=500&fit=crop',
          publicId: 'ecommerce/categories/snacks',
        },
        isActive: true,
      },
      {
        name: 'Meat & Seafood',
        slug: 'meat-seafood',
        description: 'Fresh meat and seafood products',
        image: {
          url: 'https://images.unsplash.com/photo-1555939594-58d7cb561cea?w=500&h=500&fit=crop',
          publicId: 'ecommerce/categories/meat',
        },
        isActive: true,
      },
      {
        name: 'Frozen Foods',
        slug: 'frozen-foods',
        description: 'Frozen vegetables and ready-to-eat meals',
        image: {
          url: 'https://images.unsplash.com/photo-1590080901022-ead344fd3e1f?w=500&h=500&fit=crop',
          publicId: 'ecommerce/categories/frozen',
        },
        isActive: true,
      },
      {
        name: 'Pantry Staples',
        slug: 'pantry-staples',
        description: 'Rice, pasta, flour, and cooking essentials',
        image: {
          url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop',
          publicId: 'ecommerce/categories/pantry',
        },
        isActive: true,
      },
    ];

    const categoriesCollection = db.collection('categories');
    const categoriesResult = await categoriesCollection.insertMany(categories as any);
    const categoryIds = Object.values(categoriesResult.insertedIds).map((id) => id.toString());

    console.log(`Created ${categoryIds.length} categories`);

    // Create Products
    const productsData = [
      // Fresh Produce
      {
        categoryIndex: 0,
        name: 'Organic Apples',
        description: 'Fresh, crispy organic apples grown without pesticides',
        originalPrice: 5.99,
        discountPercent: 10,
        unit: 'lb',
        stockCount: 50,
        ratingAverage: 4.5,
        reviewCount: 23,
        image: 'https://images.unsplash.com/photo-1560806674-104da8d61e96?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 0,
        name: 'Fresh Carrots',
        description: 'Crunchy, orange carrots perfect for snacking and cooking',
        originalPrice: 2.49,
        discountPercent: 0,
        unit: 'lb',
        stockCount: 75,
        ratingAverage: 4.7,
        reviewCount: 15,
        image: 'https://images.unsplash.com/photo-1566673829365-046a34e6b58e?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 0,
        name: 'Cherry Tomatoes',
        description: 'Sweet and juicy cherry tomatoes for salads',
        originalPrice: 3.99,
        discountPercent: 15,
        unit: 'lb',
        stockCount: 40,
        ratingAverage: 4.6,
        reviewCount: 18,
        image: 'https://images.unsplash.com/photo-1595566095816-f1b25055e911?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 0,
        name: 'Bananas',
        description: 'Ripe, yellow bananas rich in potassium',
        originalPrice: 1.99,
        discountPercent: 5,
        unit: 'lb',
        stockCount: 100,
        ratingAverage: 4.8,
        reviewCount: 45,
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 0,
        name: 'Broccoli',
        description: 'Fresh, green broccoli crowns packed with nutrients',
        originalPrice: 4.49,
        discountPercent: 0,
        unit: 'pc',
        stockCount: 35,
        ratingAverage: 4.4,
        reviewCount: 12,
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07f337?w=500&h=500&fit=crop',
      },
      // Dairy & Eggs
      {
        categoryIndex: 1,
        name: 'Whole Milk',
        description: 'Fresh, whole milk delivered daily',
        originalPrice: 4.99,
        discountPercent: 0,
        unit: 'gal',
        stockCount: 60,
        ratingAverage: 4.6,
        reviewCount: 28,
        image: 'https://images.unsplash.com/photo-1550009158-9ebf4a27a891?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 1,
        name: 'Cheddar Cheese',
        description: 'Aged cheddar cheese with rich flavor',
        originalPrice: 7.99,
        discountPercent: 10,
        unit: 'lb',
        stockCount: 25,
        ratingAverage: 4.7,
        reviewCount: 34,
        image: 'https://images.unsplash.com/photo-1452195745677-fc0314a14b00?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 1,
        name: 'Brown Eggs',
        description: 'Farm-fresh brown eggs, one dozen',
        originalPrice: 5.49,
        discountPercent: 0,
        unit: 'dozen',
        stockCount: 80,
        ratingAverage: 4.8,
        reviewCount: 51,
        image: 'https://images.unsplash.com/photo-1585966635170-a7b8d1e95db0?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 1,
        name: 'Greek Yogurt',
        description: 'Creamy, protein-rich greek yogurt',
        originalPrice: 6.99,
        discountPercent: 20,
        unit: 'lb',
        stockCount: 45,
        ratingAverage: 4.5,
        reviewCount: 22,
        image: 'https://images.unsplash.com/photo-1488477304112-4581273d3e5c?w=500&h=500&fit=crop',
      },
      // Bakery
      {
        categoryIndex: 2,
        name: 'Whole Wheat Bread',
        description: 'Hearty whole wheat bread, freshly baked',
        originalPrice: 4.99,
        discountPercent: 0,
        unit: 'loaf',
        stockCount: 40,
        ratingAverage: 4.6,
        reviewCount: 19,
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 2,
        name: 'Croissants',
        description: 'Buttery, flaky croissants, pack of 4',
        originalPrice: 6.99,
        discountPercent: 15,
        unit: 'pack',
        stockCount: 30,
        ratingAverage: 4.7,
        reviewCount: 26,
        image: 'https://images.unsplash.com/photo-1623518336963-f6e9bd0cf960?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 2,
        name: 'Chocolate Chip Cookies',
        description: 'Homemade-style chocolate chip cookies, dozen',
        originalPrice: 5.99,
        discountPercent: 25,
        unit: 'dozen',
        stockCount: 55,
        ratingAverage: 4.8,
        reviewCount: 41,
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 2,
        name: 'Bagels',
        description: 'Fresh bagels, pack of 6',
        originalPrice: 4.49,
        discountPercent: 0,
        unit: 'pack',
        stockCount: 50,
        ratingAverage: 4.5,
        reviewCount: 17,
        image: 'https://images.unsplash.com/photo-1585235743297-7a7ac1f08b50?w=500&h=500&fit=crop',
      },
      // Beverages
      {
        categoryIndex: 3,
        name: 'Premium Coffee',
        description: 'Single-origin arabica coffee beans, freshly roasted',
        originalPrice: 12.99,
        discountPercent: 0,
        unit: 'lb',
        stockCount: 35,
        ratingAverage: 4.7,
        reviewCount: 38,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b8f4?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 3,
        name: 'Green Tea',
        description: 'Organic green tea bags, box of 20',
        originalPrice: 6.99,
        discountPercent: 10,
        unit: 'box',
        stockCount: 60,
        ratingAverage: 4.4,
        reviewCount: 21,
        image: 'https://images.unsplash.com/photo-1597318134204-00e34f1f7e4f?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 3,
        name: 'Orange Juice',
        description: 'Fresh-squeezed orange juice, 64 oz',
        originalPrice: 7.99,
        discountPercent: 0,
        unit: 'bottle',
        stockCount: 45,
        ratingAverage: 4.6,
        reviewCount: 29,
        image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 3,
        name: 'Sparkling Water',
        description: 'Flavored sparkling water, 12-pack',
        originalPrice: 5.99,
        discountPercent: 15,
        unit: 'pack',
        stockCount: 70,
        ratingAverage: 4.5,
        reviewCount: 33,
        image: 'https://images.unsplash.com/photo-1600788148184-403f7691c00f?w=500&h=500&fit=crop',
      },
      // Snacks
      {
        categoryIndex: 4,
        name: 'Mixed Nuts',
        description: 'Roasted and salted mixed nuts, 1lb bag',
        originalPrice: 8.99,
        discountPercent: 0,
        unit: 'bag',
        stockCount: 50,
        ratingAverage: 4.7,
        reviewCount: 42,
        image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd68fcc?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 4,
        name: 'Potato Chips',
        description: 'Classic potato chips, regular flavor, 5.5 oz',
        originalPrice: 2.99,
        discountPercent: 20,
        unit: 'bag',
        stockCount: 100,
        ratingAverage: 4.3,
        reviewCount: 31,
        image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd68fcc?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 4,
        name: 'Granola Bar',
        description: 'Honey granola bars, box of 12',
        originalPrice: 6.99,
        discountPercent: 10,
        unit: 'box',
        stockCount: 80,
        ratingAverage: 4.5,
        reviewCount: 27,
        image: 'https://images.unsplash.com/photo-1543053521-318c2ec592d7?w=500&h=500&fit=crop',
      },
      // Meat & Seafood
      {
        categoryIndex: 5,
        name: 'Salmon Fillet',
        description: 'Fresh atlantic salmon fillet',
        originalPrice: 14.99,
        discountPercent: 0,
        unit: 'lb',
        stockCount: 20,
        ratingAverage: 4.8,
        reviewCount: 15,
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 5,
        name: 'Ground Beef',
        description: 'Lean ground beef, 1lb package',
        originalPrice: 6.99,
        discountPercent: 5,
        unit: 'lb',
        stockCount: 35,
        ratingAverage: 4.6,
        reviewCount: 22,
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561cea?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 5,
        name: 'Shrimp',
        description: 'Large shrimp, peeled and deveined, 1lb',
        originalPrice: 12.99,
        discountPercent: 15,
        unit: 'lb',
        stockCount: 25,
        ratingAverage: 4.7,
        reviewCount: 18,
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=500&fit=crop',
      },
      // Frozen Foods
      {
        categoryIndex: 6,
        name: 'Frozen Broccoli',
        description: 'Organic frozen broccoli florets, 1lb bag',
        originalPrice: 3.99,
        discountPercent: 0,
        unit: 'bag',
        stockCount: 60,
        ratingAverage: 4.5,
        reviewCount: 14,
        image: 'https://images.unsplash.com/photo-1590080901022-ead344fd3e1f?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 6,
        name: 'Pizza',
        description: 'Frozen pepperoni pizza, 12 inch',
        originalPrice: 8.99,
        discountPercent: 20,
        unit: 'pc',
        stockCount: 40,
        ratingAverage: 4.4,
        reviewCount: 24,
        image: 'https://images.unsplash.com/photo-1571407614527-71f63fb465f8?w=500&h=500&fit=crop',
      },
      // Pantry Staples
      {
        categoryIndex: 7,
        name: 'Jasmine Rice',
        description: 'Premium jasmine rice, 5lb bag',
        originalPrice: 7.99,
        discountPercent: 0,
        unit: 'bag',
        stockCount: 50,
        ratingAverage: 4.6,
        reviewCount: 19,
        image: 'https://images.unsplash.com/photo-1586080872579-fe1d88a82f27?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 7,
        name: 'Pasta',
        description: 'Whole wheat pasta, 1lb box',
        originalPrice: 2.49,
        discountPercent: 10,
        unit: 'box',
        stockCount: 80,
        ratingAverage: 4.5,
        reviewCount: 16,
        image: 'https://images.unsplash.com/photo-1612874742237-6526221fcd2b?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 7,
        name: 'All-Purpose Flour',
        description: 'All-purpose flour, 5lb bag',
        originalPrice: 3.99,
        discountPercent: 0,
        unit: 'bag',
        stockCount: 70,
        ratingAverage: 4.7,
        reviewCount: 21,
        image: 'https://images.unsplash.com/photo-1585707572020-96c6250cdb7d?w=500&h=500&fit=crop',
      },
      {
        categoryIndex: 7,
        name: 'Olive Oil',
        description: 'Extra virgin olive oil, 500ml bottle',
        originalPrice: 11.99,
        discountPercent: 5,
        unit: 'bottle',
        stockCount: 30,
        ratingAverage: 4.8,
        reviewCount: 35,
        image: 'https://images.unsplash.com/photo-1606787619249-a0f8e7e49c8f?w=500&h=500&fit=crop',
      },
    ];

    const products: Product[] = productsData.map((p, index) => ({
      userId: adminId,
      categoryId: categoryIds[p.categoryIndex],
      name: p.name,
      slug: p.name.toLowerCase().replace(/\s+/g, '-'),
      description: p.description,
      images: [
        {
          url: p.image,
          publicId: `ecommerce/products/product-${index}`,
        },
      ],
      originalPrice: p.originalPrice,
      salePrice: Math.round((p.originalPrice * (1 - p.discountPercent / 100)) * 100) / 100,
      discountPercent: p.discountPercent,
      discountLabel: p.discountPercent > 0 ? `${p.discountPercent}% off` : undefined,
      unit: p.unit,
      stockCount: p.stockCount,
      ratingAverage: p.ratingAverage,
      reviewCount: p.reviewCount,
      isActive: true,
    }));

    const productsCollection = db.collection('products');
    const productsResult = await productsCollection.insertMany(products as any);
    const productIds = Object.values(productsResult.insertedIds).map((id) => id.toString());

    console.log(`Created ${productIds.length} products`);

    // Create Orders
    const orders: Order[] = [
      {
        userId: customerIds[0],
        orderNo: 'ORD-2024-001',
        items: [
          {
            productId: productIds[0],
            name: 'Organic Apples',
            image: products[0].images[0].url,
            originalPrice: products[0].originalPrice,
            discountPercent: products[0].discountPercent,
            salePrice: products[0].salePrice,
            quantity: 2,
            isReviewed: true,
          },
          {
            productId: productIds[6],
            name: 'Cheddar Cheese',
            image: products[6].images[0].url,
            originalPrice: products[6].originalPrice,
            discountPercent: products[6].discountPercent,
            salePrice: products[6].salePrice,
            quantity: 1,
            isReviewed: false,
          },
        ],
        shippingAddress: {
          recipientName: 'John Doe',
          phone: '+1-555-0102',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
        },
        paymentMethod: 'credit_card',
        paymentStatus: 'completed',
        status: 'delivered',
        statusHistory: [
          { status: 'pending', date: new Date('2024-08-01') },
          { status: 'processing', date: new Date('2024-08-02') },
          { status: 'shipped', date: new Date('2024-08-03') },
          { status: 'delivered', date: new Date('2024-08-05') },
        ],
        subtotal: 9.98 + 7.19,
        deliveryFee: 5.0,
        tax: 1.37,
        total: 23.54,
      },
      {
        userId: customerIds[1],
        orderNo: 'ORD-2024-002',
        items: [
          {
            productId: productIds[8],
            name: 'Brown Eggs',
            image: products[8].images[0].url,
            originalPrice: products[8].originalPrice,
            discountPercent: products[8].discountPercent,
            salePrice: products[8].salePrice,
            quantity: 1,
            isReviewed: true,
          },
        ],
        shippingAddress: {
          recipientName: 'Jane Smith',
          phone: '+1-555-0103',
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'USA',
        },
        paymentMethod: 'credit_card',
        paymentStatus: 'completed',
        status: 'shipped',
        statusHistory: [
          { status: 'pending', date: new Date('2024-08-10') },
          { status: 'processing', date: new Date('2024-08-11') },
          { status: 'shipped', date: new Date('2024-08-12') },
        ],
        subtotal: 5.49,
        deliveryFee: 5.0,
        tax: 0.84,
        total: 11.33,
      },
      {
        userId: customerIds[0],
        orderNo: 'ORD-2024-003',
        items: [
          {
            productId: productIds[15],
            name: 'Premium Coffee',
            image: products[15].images[0].url,
            originalPrice: products[15].originalPrice,
            discountPercent: products[15].discountPercent,
            salePrice: products[15].salePrice,
            quantity: 1,
            isReviewed: false,
          },
          {
            productId: productIds[20],
            name: 'Salmon Fillet',
            image: products[20].images[0].url,
            originalPrice: products[20].originalPrice,
            discountPercent: products[20].discountPercent,
            salePrice: products[20].salePrice,
            quantity: 1,
            isReviewed: false,
          },
        ],
        shippingAddress: {
          recipientName: 'John Doe',
          phone: '+1-555-0102',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
        },
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        status: 'placed',
        statusHistory: [{ status: 'placed', date: new Date() }],
        subtotal: 12.99 + 14.99,
        deliveryFee: 5.0,
        tax: 4.26,
        total: 37.24,
      },
    ];

    const ordersCollection = db.collection('orders');
    const ordersResult = await ordersCollection.insertMany(orders as any);

    console.log(`Created ${orders.length} orders`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Development Credentials:');
    console.log('  Admin: admin@example.com / password123');
    console.log('  User: john@example.com / password123');
    console.log('  User: jane@example.com / password123');
    console.log('  User: bob@example.com / password123');
    console.log('  User: alice@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
