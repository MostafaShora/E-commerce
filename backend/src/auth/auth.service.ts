import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async register(data: RegisterDto) {
    const existingUser = await this.userModel.findOne({
      email: data.email,
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const user = await this.userModel.create(data);

    return user.toJSON();
  }

  async login(data: LoginDto) {
    const user = await this.userModel
      .findOne({
        email: data.email,
      })
      .select('+password');

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await user.comparePassword(data.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user.toJSON();
  }

  async findUserById(userId: string) {
    return this.userModel.findById(userId).select('-password').lean();
  }
}
