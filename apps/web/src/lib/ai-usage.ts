import { supabaseAdmin } from "./supabase";

const monthKey = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};

export async function recordAiAction(companyId: string, qty = 1) {
  const { data: bill } = await supabaseAdmin
    .from("company_billing")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (!bill || bill.status !== "active") {
    throw new Error("Billing inactive");
  }

  if (bill.ai_hard_capped) {
    throw new Error("AI hard capped");
  }

  const key = monthKey();
  const { data: agg } = await supabaseAdmin
    .from("ai_usage_aggregates")
    .upsert(
      { company_id: companyId, month_key: key, actions_used: 0 },
      { onConflict: "company_id,month_key" },
    )
    .select("*")
    .single();

  const used = (agg?.actions_used ?? 0) + qty;
  const hardCap = bill.ai_included * bill.ai_hard_cap_multiplier;

  await supabaseAdmin
    .from("ai_usage_aggregates")
    .update({ actions_used: used })
    .eq("company_id", companyId)
    .eq("month_key", key);

  if (used >= hardCap) {
    await supabaseAdmin
      .from("company_billing")
      .update({ ai_hard_capped: true })
      .eq("company_id", companyId);

    throw new Error("AI hard cap reached");
  }

  return { used, included: bill.ai_included };
}
