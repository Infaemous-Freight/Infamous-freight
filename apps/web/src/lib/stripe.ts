import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Environment variable STRIPE_SECRET_KEY is not set.");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-01-28.clover",
});
