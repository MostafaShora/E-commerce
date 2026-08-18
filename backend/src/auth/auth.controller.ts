import { Body, Controller, Post, Res } from '@nestjs/common';

import type { Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() data: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.register(data);

    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      this.configService.get<string>('JWT_SECRET')!,
      {
        audience: ['user'],
        expiresIn: '7d',
      },
    );

    res.cookie('instant_access_token', token, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite:
        this.configService.get<string>('NODE_ENV') === 'production'
          ? 'strict'
          : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'User registered successfully',
      user,
    };
  }

  @Post('login')
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.login(data);

    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      this.configService.get<string>('JWT_SECRET')!,
      {
        audience: ['user'],
        expiresIn: '7d',
      },
    );

    res.cookie('instant_access_token', token, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite:
        this.configService.get<string>('NODE_ENV') === 'production'
          ? 'strict'
          : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'User logged in successfully',
      user,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('instant_access_token');

    return {
      message: 'User logged out successfully',
    };
  }
}
