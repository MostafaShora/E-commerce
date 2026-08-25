import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { AddressModule } from './address/address.module';
import { OrderModule } from './order/order.module';
import { ENV } from './config/env.config';
import { StripeModule } from './webhooks/stripe-webhook.module';
import { ReviewModule } from './review/review.module';
import { AIModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => ({
        uri: ENV.MONGO_URI,
      }),
    }),

    AuthModule,
    CategoryModule,
    ProductModule,
    CartModule,
    AddressModule,
    OrderModule,
    StripeModule,
    ReviewModule,
    AIModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
