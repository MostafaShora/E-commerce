import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import slugify from 'slugify';

import { calculateSalePrice } from '../../common/utils/price.util';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  publicId: string;
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

@Schema({
  timestamps: true,
})
export class Product {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  categoryId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
  })
  slug: string;

  @Prop({
    type: String,
    default: undefined,
  })
  description?: string;

  @Prop({
    type: [ProductImageSchema],
    default: [],
  })
  images: ProductImage[];

  @Prop({
    required: true,
    min: 0,
  })
  originalPrice: number;

  @Prop({
    default: 0,
  })
  salePrice: number;

  @Prop({
    default: 0,
    min: 0,
    max: 100,
  })
  discountPercent: number;

  @Prop({
    type: String,
    default: undefined,
  })
  discountLabel?: string;

  @Prop({
    default: 'pc',
  })
  unit: string;

  @Prop({
    default: 0,
    min: 0,
  })
  stockCount: number;

  @Prop({
    default: 0,
    min: 0,
    max: 5,
  })
  ratingAverage: number;

  @Prop({
    default: 0,
    min: 0,
  })
  reviewCount: number;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.pre('validate', function () {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }

  if (this.isModified('originalPrice') || this.isModified('discountPercent')) {
    if (this.discountPercent > 0) {
      this.salePrice = calculateSalePrice(
        this.originalPrice,
        this.discountPercent,
      );
    } else {
      this.salePrice = this.originalPrice;
    }
  }
});
