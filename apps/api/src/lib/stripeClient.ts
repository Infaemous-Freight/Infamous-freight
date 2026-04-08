import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is required for Stripe operations");
  }

  stripeClient = new Stripe(apiKey);
  return stripeClient;
}

export function hasStripeClientConfig(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
