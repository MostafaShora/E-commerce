import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AddressDocument = HydratedDocument<Address>;

@Schema({
  timestamps: true,
})
export class Address {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  recipientName: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  phone: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  street: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  city: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  state: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  postalCode: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  country: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
