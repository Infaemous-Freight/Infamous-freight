import Stripe from "stripe";

let stripeClient: Stripe | null = null;
let stripeClientKey: string | null = null;

export function getStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is required for Stripe operations");
  }

  if (stripeClient && stripeClientKey === apiKey) {
    return stripeClient;
  }

  stripeClient = new Stripe(apiKey);
  stripeClientKey = apiKey;
  return stripeClient;
}

export function hasStripeClientConfig(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function resetStripeClientForTests(): void {
  stripeClient = null;
  stripeClientKey = null;
}
