import { supabaseAdmin } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { getSubscriptionItem } from "@/lib/billing";

function utcMonthKey(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function recordAiActionsAndReport(
  companyId: string,
  qty = 1,
  actorUserId: string | null = null,
) {
  const { data: billing } = await supabaseAdmin
    .from("company_billing")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (!billing) throw new Error("Billing missing");
  if (billing.status !== "active") throw new Error(`Billing not active (${billing.status})`);
  if (billing.ai_hard_capped) throw new Error("AI hard cap reached");

  const month_key = utcMonthKey();

  const { data: aggregate, error: aggregateError } = await supabaseAdmin.rpc(
    "increment_ai_usage_aggregate",
    {
      company_id: companyId,
      month_key,
      qty,
    },
  );

  if (aggregateError) {
    throw new Error(`Failed to record AI usage: ${aggregateError.message}`);
  }

  const used = aggregate?.actions_used ?? 0;

  const included = billing.ai_included;
  const pct = included > 0 ? used / included : 0;
  const multiplier = billing.ai_hard_cap_multiplier;
  if (typeof multiplier !== "number" || !Number.isFinite(multiplier) || multiplier <= 0) {
    throw new Error("Invalid AI hard cap multiplier in billing config");
  }
  const hardCap = included * multiplier;

  if (pct >= 0.8 && pct < 1) {
    await supabaseAdmin.from("audit_logs").insert({
      company_id: companyId,
      actor_user_id: actorUserId,
      action: "ai.usage.alert_80pct",
      meta: { used, included, pct },
    });
  }

  if (used >= hardCap) {
    await supabaseAdmin
      .from("company_billing")
      .update({ ai_hard_capped: true })
      .eq("company_id", companyId);

    await supabaseAdmin.from("audit_logs").insert({
      company_id: companyId,
      actor_user_id: actorUserId,
      action: "ai.usage.hard_capped",
      meta: { used, included, hardCap },
    });

    throw new Error(
      `AI hard cap reached (${billing.ai_hard_cap_multiplier * 100}%). Upgrade or admin unlock required.`,
    );
  }

  const priceId = process.env.AI_METERED_PRICE_ID!;
  const subItemId = await getSubscriptionItem(companyId, priceId);

  if (subItemId) {
    await stripe.subscriptionItems.createUsageRecord(subItemId, {
      quantity: qty,
      timestamp: Math.floor(Date.now() / 1000),
      action: "increment",
    });
  } else {
    await supabaseAdmin.from("audit_logs").insert({
      company_id: companyId,
      actor_user_id: actorUserId,
      action: "stripe.usage.not_reported_missing_sub_item",
      meta: { priceId },
    });

    throw new Error(
      `Stripe subscription item missing for AI metered price; usage was not billed (priceId=${priceId})`,
    );
  }

  await supabaseAdmin.from("audit_logs").insert({
    company_id: companyId,
    actor_user_id: actorUserId,
    action: "ai.action.executed",
    meta: { qty, used, included, pct },
  });

  return { used, included, pct };
}
