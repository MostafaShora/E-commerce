import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';

import { Order, OrderSchema } from './schemas/order.schema';

import { Cart, CartSchema } from '../cart/schemas/cart.schema';
import { Address, AddressSchema } from '../address/schemas/address.schema';
import { Product, ProductSchema } from '../product/schemas/product.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: Cart.name,
        schema: CartSchema,
      },
      {
        name: Address.name,
        schema: AddressSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  controllers: [OrderController],

  providers: [OrderService],

  exports: [OrderService],
})
export class OrderModule {}
