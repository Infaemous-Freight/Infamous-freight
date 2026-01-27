const { stripeClient } = require("./stripe");
const persist = require("./persist");
const { getPrisma } = require("../db/prisma");

const FEATURE_UNITS = {
  ai_routing: "run",
  ai_invoice_audit: "invoice",
  genesis_ai_agent: "tokens_1k",
  ocr_parsing: "doc",
};

function estimateTokenUnits(text) {
  if (!text) return 1;
  const estimatedTokens = Math.max(1, Math.ceil(text.length / 4));
  return Math.max(1, Math.ceil(estimatedTokens / 1000));
}

async function recordUsage({
  tenantId,
  feature,
  quantity,
  timestamp,
  subscriptionItemId,
}) {
  if (!tenantId || !feature || quantity <= 0) {
    return { ok: false, reason: "missing_params" };
  }

  const stripe = stripeClient();
  const entitlements = await persist.getEntitlements(tenantId);
  const resolvedSubscriptionItemId =
    subscriptionItemId || entitlements?.stripe_ai_subscription_item_id;

  if (!stripe || !resolvedSubscriptionItemId) {
    return { ok: false, reason: "stripe_unavailable" };
  }

  const usageRecord = await stripe.subscriptionItems.createUsageRecord(
    resolvedSubscriptionItemId,
    {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
      action: "increment",
    }
  );

  const prisma = getPrisma();
  if (prisma) {
    await prisma.aiUsageRecord.create({
      data: {
        tenantId,
        feature,
        stripeSubscriptionItemId: resolvedSubscriptionItemId,
        quantity,
        stripeUsageRecordId: usageRecord.id,
      },
    });
  }

  return {
    ok: true,
    feature,
    unit: FEATURE_UNITS[feature] || "unit",
    quantity,
    usageRecordId: usageRecord.id,
  };
}

module.exports = {
  recordUsage,
  estimateTokenUnits,
  FEATURE_UNITS,
};
