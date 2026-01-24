import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      // Use the API version configured in your Stripe account where possible.
      apiVersion: "2024-06-20",
    })
  : null;
