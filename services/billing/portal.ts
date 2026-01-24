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
): Promise<string> {
  // Basic validation for Stripe customer ID format (e.g. "cus_XXXXXXXX")
  const customerIdPattern = /^cus_[A-Za-z0-9]+$/;
  if (!customerIdPattern.test(stripeCustomerId)) {
    throw new Error("Invalid Stripe customer ID format.");
  }

  // Validate returnUrl as a proper URL
  try {
    // eslint-disable-next-line no-new
    new URL(returnUrl);
  } catch {
    throw new Error("Invalid return URL.");
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    // Log structured error before rethrowing
    // Using console.error here to avoid relying on project-specific logger imports
    console.error("Failed to create Stripe billing portal session", {
      stripeCustomerId,
      returnUrl,
      error,
    });
    throw new Error("Failed to create billing portal session.");
  }
}