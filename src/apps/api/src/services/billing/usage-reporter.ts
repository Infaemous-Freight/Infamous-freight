import type Stripe from "stripe";

export type UsageReportItem = {
  subscriptionItemId: string;
  feature: string;
  quantity: number;
  timestamp: number;
};

export async function reportUsageForTenant(
  stripe: Stripe,
  tenantId: string,
  usage: UsageReportItem[],
): Promise<void> {
  for (const { subscriptionItemId, feature, quantity, timestamp } of usage) {
    const ts = Math.floor(timestamp);
    const qty = Math.floor(quantity);
    const idempotencyKey = [
      "usage",
      tenantId,
      subscriptionItemId,
      feature,
      ts,
      qty,
    ].join(":");

    await stripe.subscriptionItems.createUsageRecord(
      subscriptionItemId,
      {
        quantity: qty,
        timestamp: ts,
        action: "increment",
      },
      { idempotencyKey },
    );
  }
}
