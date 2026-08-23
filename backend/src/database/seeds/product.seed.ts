import 'dotenv/config';
import mongoose from 'mongoose';

import { ENV } from '../../config/env.config';
import { Product, ProductSchema } from '../../product/schemas/product.schema';
import {
  Category,
  CategorySchema,
} from '../../category/schemas/category.schema';
import { User, UserSchema } from '../../auth/schemas/user.schema';

const seedProducts = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);

    console.log('Database connected');

    const ProductModel =
      mongoose.models.Product || mongoose.model(Product.name, ProductSchema);

    const CategoryModel =
      mongoose.models.Category || mongoose.model(Category.name, CategorySchema);

    const UserModel =
      mongoose.models.User || mongoose.model(User.name, UserSchema);

    // Get existing user
    const user = await UserModel.findOne();

    if (!user) {
      throw new Error(
        'No user found. Please register a user first before seeding products.',
      );
    }

    // Get existing categories
    const categories = await CategoryModel.find({
      isActive: true,
    }).limit(4);

    if (categories.length === 0) {
      throw new Error('No categories found. Please run category seed first.');
    }

    console.log(`Using user: ${user.email}`);
    console.log(`Found ${categories.length} categories`);

    // Clear existing products
    await ProductModel.deleteMany({});

    console.log('Existing products cleared');

    const products = [
      {
        userId: user._id,
        categoryId: categories[0]._id,

        name: 'Fresh Apples',
        description: 'Crisp and juicy red apples',
        images: ['https://example.com/apple.jpg'],

        originalPrice: 4.99,
        discountPercent: 0,

        unit: 'kg',
        stockCount: 100,

        isActive: true,
      },

      {
        userId: user._id,
        categoryId: categories[1]?._id ?? categories[0]._id,

        name: 'Organic Bananas',
        description: 'Sweet organic bananas',
        images: ['https://example.com/banana.jpg'],

        originalPrice: 3.49,
        discountPercent: 10,
        discountLabel: '10% OFF',

        unit: 'kg',
        stockCount: 75,

        isActive: true,
      },

      {
        userId: user._id,
        categoryId: categories[2]?._id ?? categories[0]._id,

        name: 'Whole Wheat Bread',
        description: 'Freshly baked whole wheat bread',
        images: ['https://example.com/bread.jpg'],

        originalPrice: 2.99,
        discountPercent: 0,

        unit: 'pc',
        stockCount: 50,

        isActive: true,
      },

      {
        userId: user._id,
        categoryId: categories[3]?._id ?? categories[0]._id,

        name: 'Orange Juice',
        description: 'Fresh squeezed orange juice',
        images: ['https://example.com/juice.jpg'],

        originalPrice: 5.99,
        discountPercent: 15,
        discountLabel: '15% OFF',

        unit: 'pc',
        stockCount: 30,

        isActive: true,
      },
    ];

    const created = await ProductModel.create(products);

    console.log(`${created.length} products seeded successfully`);

    for (const product of created) {
      console.log(`${product.name} | ${product.salePrice} | ${product.slug}`);
    }

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedProducts();
