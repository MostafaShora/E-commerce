import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

jest.mock('../config/env.config', () => ({
  ENV: { FRONTEND_ORIGIN: 'http://localhost:4200' },
}));
jest.mock('../config/stripe.config', () => ({
  __esModule: true,
  default: { checkout: { sessions: { create: jest.fn() } } },
}));

describe('OrderController', () => {
  let controller: OrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: {} }],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
