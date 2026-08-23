import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';

import type { Request } from 'express';

import Stripe from 'stripe';

import stripeClient from '../config/stripe.config';
import { ENV } from '../config/env.config';

@Controller('webhook')
export class StripeWebhookController {
  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;

    try {
      event = stripeClient.webhooks.constructEvent(
        req.rawBody!,
        signature,
        ENV.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      console.error('Stripe webhook signature verification failed', error);

      return {
        received: false,
        message: 'Webhook signature verification failed',
      };
    }

    console.log(`Stripe event received: ${event.type}`);

    return {
      received: true,
    };
  }
}
