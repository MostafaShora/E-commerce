import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { compareValue, hashValue } from '../../common/utils/bcrypt.util';

import { USER_ROLE_VALUES, USER_ROLES } from '../../common/constants/enums';

import type { UserRole } from '../../common/constants/enums';

export type UserDocument = HydratedDocument<User> & {
  comparePassword(candidatePassword: string): Promise<boolean>;
};

@Schema({
  timestamps: true,
  toJSON: {
    transform(_doc, ret) {
      delete (ret as { password?: string }).password;
      return ret;
    },
  },
})
export class User {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
    minlength: 6,
    select: false,
  })
  password: string;

  @Prop({
    type: String,
    enum: USER_ROLE_VALUES,
    default: USER_ROLES.USER,
  })
  role: UserRole;

  @Prop({
    type: String,
    default: undefined,
  })
  phone?: string;

  @Prop({
    type: String,
    default: undefined,
  })
  avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await hashValue(this.password);
  }
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return compareValue(candidatePassword, this.password);
};
