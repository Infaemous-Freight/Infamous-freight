import type Stripe from "stripe";

export type UsageReportItem = {
  subscriptionItemId: string;
  feature: string;
  quantity: number;
  timestamp: number;
};

function assertValidUsageInteger(
  fieldName: "timestamp" | "quantity",
  value: number,
): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${fieldName}: value must be a finite number`);
  }
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid ${fieldName}: value must be an integer`);
  }
  if (value < 0) {
    throw new Error(`Invalid ${fieldName}: value must be non-negative`);
  }
  if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new Error(
      `Invalid ${fieldName}: value exceeds Number.MAX_SAFE_INTEGER`,
    );
  }
}

export async function reportUsageForTenant(
  stripe: Stripe,
  tenantId: string,
  usage: UsageReportItem[],
): Promise<void> {
  for (const { subscriptionItemId, feature, quantity, timestamp } of usage) {
    // Validate inputs instead of coercing with Math.floor, to avoid
    // silently under-reporting usage or sending invalid values to Stripe.
    assertValidUsageInteger("timestamp", timestamp);
    assertValidUsageInteger("quantity", quantity);

    const ts = timestamp;
    const qty = quantity;
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
