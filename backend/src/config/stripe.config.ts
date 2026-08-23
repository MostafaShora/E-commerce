import Stripe from 'stripe';
import { ENV } from './env.config';

const stripeClient = new Stripe(ENV.STRIPE_SECRET_KEY);

export default stripeClient;
