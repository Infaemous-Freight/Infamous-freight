import { stripe } from "./stripe";
import type { AiMeteredFeature } from "./pricing-map";

/**
 * Map a Stripe price `lookup_key` to a known AiMeteredFeature, or return `null` if not recognized.
 *
 * @param lookupKey - The Stripe price `lookup_key` to translate (may be `null`)
import { AI_LOOKUP_KEYS } from "./pricing-map";
import type { AiMeteredFeature } from "./pricing-map";

function featureKeyFromLookupKey(lookupKey: string | null): AiMeteredFeature | null {
  if (!lookupKey) return null;
  const allowed = new Set(Object.keys(AI_LOOKUP_KEYS));
  return allowed.has(lookupKey) ? (lookupKey as AiMeteredFeature) : null;
}

/**
 * Persist or update tenant billing and subscription details derived from a Stripe subscription.
 *
 * @param args.stripeCustomerId - Stripe Customer ID associated with the subscription
 * @param args.stripeSubscriptionId - Stripe Subscription ID
 * @param args.items - Map from AiMeteredFeature key to Stripe subscription item ID (si_...)
 * @param args.plan - Optional plan identifier extracted from subscription metadata, or `null` if absent
 * @param args.tenantId - Optional tenant identifier extracted from subscription metadata, or `null` if absent
 */
async function upsertTenantBillingFromSubscription(args: {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  items: Record<string, string>; // feature -> si_...
  plan: string | null;
  tenantId: string | null;
}) {
  // TODO: persist in DB
  void args;
}

/**
 * Synchronizes tenant billing state from a Stripe subscription.
 *
 * Retrieves the subscription (with price data expanded), maps price lookup keys to known metered features, reads tenant and plan metadata, and upserts the resulting billing/subscription data.
 *
 * @param subscriptionId - Stripe subscription identifier to retrieve and synchronize
 */
export async function handleSubscriptionUpsert(subscriptionId: string) {
  // Basic validation for Stripe subscription ID format before calling the API
  if (
    typeof subscriptionId !== "string" ||
    subscriptionId.length === 0 ||
    !/^sub_[A-Za-z0-9]+$/.test(subscriptionId)
  ) {
    throw new Error(
      `Invalid Stripe subscription ID format: "${subscriptionId}"`
    );
  }

  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price"],
    });

    const stripeCustomerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    const items: Record<string, string> = {};
    for (const it of sub.items.data) {
      const price = it.price;
      const lookupKey = (price as { lookup_key?: string | null }).lookup_key ?? null;
      const key = featureKeyFromLookupKey(lookupKey);
      if (key) items[key] = it.id;
    }

    const tenantId = (sub.metadata?.tenantId as string) ?? null;
    const plan = (sub.metadata?.plan as string) ?? null;

    await upsertTenantBillingFromSubscription({
      stripeCustomerId,
      stripeSubscriptionId: sub.id,
      items,
      plan,
      tenantId,
    });
  } catch (err) {
    // Structured error logging with context about the failed operation
    console.error("Failed to handle Stripe subscription upsert", {
      subscriptionId,
      error:
        err instanceof Error
          ? { message: err.message, stack: err.stack }
          : err,
    });
    throw err;
  }
}