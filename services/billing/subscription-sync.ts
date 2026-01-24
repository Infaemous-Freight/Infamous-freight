import { stripe } from "./stripe";
import type { AiMeteredFeature } from "./pricing-map";

/**
 * Map a Stripe price `lookup_key` to a known AiMeteredFeature, or return `null` if not recognized.
 *
 * @param lookupKey - The Stripe price `lookup_key` to translate (may be `null`)
 * @returns The matching `AiMeteredFeature` for `lookupKey`, or `null` if `lookupKey` is missing or unsupported
 */
function featureKeyFromLookupKey(lookupKey: string | null): AiMeteredFeature | null {
  if (!lookupKey) return null;
  const allowed = new Set([
    "ai_chat_1k_tokens",
    "ai_dispatch",
    "ai_invoice_audit",
    "ai_route_optimization",
    "ai_predictive_eta",
    "ai_fleet_health_scan",
    "ai_fraud_detection",
    "ai_load_match",
  ]);
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
}