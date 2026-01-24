import { stripe } from "./stripe";
import type { UsageTotals } from "./usage-aggregator";

/**
 * Create Stripe usage records for tenant overage quantities.
 *
 * Creates an "increment" usage record for each feature in `params.usage` that has a positive quantity and a matching subscription item ID.
 *
 * @param params.stripeSubscriptionItems - Map from feature name to Stripe subscription item ID (e.g., `"si_..."`) used to identify where to record usage.
 * @param params.usage - Per-feature overage quantities; entries with non-positive values are ignored. Quantities are floored before being recorded.
 * @param params.timestamp - UNIX timestamp (seconds) to attach to created usage records; defaults to the current time when omitted.
import type { AiMeteredFeature } from "@infamous-freight/shared";

export async function reportUsageForTenant(params: {
  stripeSubscriptionItems: Partial<Record<AiMeteredFeature, string>>; // feature -> si_...
  usage: UsageTotals; // overage only
  timestamp?: number;
}) {
  const ts = params.timestamp ?? Math.floor(Date.now() / 1000);

  for (const [feature, qty] of Object.entries(params.usage)) {
    if (!qty || qty <= 0) continue;

    const subscriptionItemId = params.stripeSubscriptionItems[feature];
    if (!subscriptionItemId) continue;

    try {
      await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity: Math.floor(qty),
        timestamp: ts,
        action: "increment",
      });
    } catch (err) {
      // Log and continue so one failure does not prevent reporting other features
      console.error("Failed to report Stripe usage record", {
        feature,
        quantity: qty,
        subscriptionItemId,
        timestamp: ts,
        error:
          err instanceof Error
            ? { message: err.message, stack: err.stack }
            : { message: String(err) },
      });
    }
  }
}