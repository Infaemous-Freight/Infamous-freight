import { supabaseAdmin } from "@/lib/supabase/admin";
import { utcMonthKey } from "@/lib/enterprise";
import { audit } from "@/lib/gating";

export async function recordAiActions(
  companyId: string,
  qty = 1,
  actorUserId: string | null = null,
) {
  const { data: billing } = await supabaseAdmin
    .from("company_billing")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (!billing) {
    throw new Error("Billing missing");
  }

  if (billing.status !== "active") {
    throw new Error(`Billing not active (${billing.status})`);
  }

  if (billing.ai_hard_capped) {
    throw new Error("AI hard cap reached");
  }

  const month = utcMonthKey();
  const { data: aggregate } = await supabaseAdmin
    .from("ai_usage_aggregates")
    .upsert(
      { company_id: companyId, month_key: month, actions_used: 0 },
      { onConflict: "company_id,month_key" },
    )
    .select("*")
    .single();

  const used = (aggregate?.actions_used ?? 0) + qty;

  await supabaseAdmin
    .from("ai_usage_aggregates")
    .update({ actions_used: used })
    .eq("company_id", companyId)
    .eq("month_key", month);

  const included = billing.ai_included;
  const pct = included > 0 ? used / included : 0;
  const hardCap = included * billing.ai_hard_cap_multiplier;

  if (pct >= 0.8 && pct < 1) {
    await audit(companyId, actorUserId, "ai.usage.alert_80pct", {
      used,
      included,
      pct,
    });
  }

  if (used >= hardCap) {
    await supabaseAdmin
      .from("company_billing")
      .update({ ai_hard_capped: true })
      .eq("company_id", companyId);
    await audit(companyId, actorUserId, "ai.usage.hard_capped", {
      used,
      included,
      hardCap,
    });
    throw new Error("AI hard cap reached (200%). Upgrade or approve overage.");
  }

  await audit(companyId, actorUserId, "ai.action.executed", {
    qty,
    used,
    included,
    pct,
  });

  return { used, included, pct };
}
