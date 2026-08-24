import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';

import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';

import stripeClient from '../config/stripe.config';
import { ENV } from '../config/env.config';
import { OrderService } from '../order/order.service';

@Controller('webhook')
export class StripeWebhookController {
  constructor(private readonly orderService: OrderService) {}

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    if (!req.rawBody) {
      console.error('Stripe webhook rawBody is missing');
      throw new BadRequestException('Missing raw webhook body');
    }

    let event: Stripe.Event;

    try {
      event = stripeClient.webhooks.constructEvent(
        req.rawBody,
        signature,
        ENV.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      console.error('Stripe webhook signature verification failed:', error);

      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    console.log(`Stripe event received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const orderId = session.metadata?.orderId;

        if (!orderId) {
          throw new BadRequestException(
            'Missing orderId in Stripe session metadata',
          );
        }

        await this.orderService.handleStripePaymentSuccess(orderId, session);

        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;

        const orderId = session.metadata?.orderId;

        if (orderId) {
          await this.orderService.handleStripePaymentFailed(orderId, session);
        }

        break;
      }

      default:
        break;
    }

    return {
      received: true,
    };
  }
}
