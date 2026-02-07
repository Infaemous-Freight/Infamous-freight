import { supabaseAdmin } from "./supabase";
import { stripe } from "./stripe";
import { getSubscriptionItem } from "./billing";

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
  const { data: agg } = await supabaseAdmin
    .from("ai_usage_aggregates")
    .upsert(
      { company_id: companyId, month_key, actions_used: 0 },
      { onConflict: "company_id,month_key" },
    )
    .select("*")
    .single();

  const used = (agg?.actions_used ?? 0) + qty;

  await supabaseAdmin
    .from("ai_usage_aggregates")
    .update({ actions_used: used })
    .eq("company_id", companyId)
    .eq("month_key", month_key);

  const included = billing.ai_included;
  const pct = included > 0 ? used / included : 0;
  const hardCap = included * billing.ai_hard_cap_multiplier;

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
    throw new Error("AI hard cap reached (200%). Upgrade or admin unlock required.");
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
  }

  await supabaseAdmin.from("audit_logs").insert({
    company_id: companyId,
    actor_user_id: actorUserId,
    action: "ai.action.executed",
    meta: { qty, used, included, pct },
  });

  return { used, included, pct };
}
