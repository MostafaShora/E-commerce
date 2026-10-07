import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OrderService } from './order.service';
import { Order } from './schemas/order.schema';
import { Cart } from '../cart/schemas/cart.schema';
import { Address } from '../address/schemas/address.schema';
import { Product } from '../product/schemas/product.schema';
import { User } from '../auth/schemas/user.schema';

jest.mock('../config/env.config', () => ({
  ENV: { FRONTEND_ORIGIN: 'http://localhost:4200' },
}));
jest.mock('../config/stripe.config', () => ({
  __esModule: true,
  default: { checkout: { sessions: { create: jest.fn() } } },
}));

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getModelToken(Order.name), useValue: {} },
        { provide: getModelToken(Cart.name), useValue: {} },
        { provide: getModelToken(Address.name), useValue: {} },
        { provide: getModelToken(Product.name), useValue: {} },
        { provide: getModelToken(User.name), useValue: {} },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
