import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import slugify from 'slugify';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ _id: false })
export class CategoryImage {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  publicId: string;
}

export const CategoryImageSchema = SchemaFactory.createForClass(CategoryImage);

@Schema({
  timestamps: true,
})
export class Category {
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
    type: CategoryImageSchema,
    default: null,
  })
  image: CategoryImage | null;

  @Prop({
    type: String,
    default: undefined,
  })
  description?: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.pre('validate', function () {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
});
