import { stripe } from "./stripe";

/**
 * Create a Stripe Billing Portal session for a customer and obtain its URL.
 *
 * @param stripeCustomerId - The Stripe Customer ID to create the portal session for.
 * @param returnUrl - The URL to redirect the user to after they leave the billing portal.
 * @returns The URL of the created billing portal session.
 */
export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}