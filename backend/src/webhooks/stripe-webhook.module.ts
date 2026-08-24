import { Module } from '@nestjs/common';

import { StripeWebhookController } from './stripe-webhook.controller';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [StripeWebhookController],
})
export class StripeModule {}
