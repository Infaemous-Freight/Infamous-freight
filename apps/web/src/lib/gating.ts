import { supabaseAdmin } from "@/lib/supabase/admin";

export async function requireCompany(companyId: string) {
  if (!companyId) {
    throw new Error("Missing companyId");
  }
  return companyId;
}

export async function requireActiveBilling(companyId: string) {
  const { data, error } = await supabaseAdmin
    .from("company_billing")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (error || !data) {
    throw new Error("Billing row missing");
  }

  if (data.status !== "active") {
    throw new Error(`Billing not active (${data.status})`);
  }

  return data;
}

export async function requireFeature(companyId: string, key: string) {
  const { data, error } = await supabaseAdmin
    .from("company_features")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (error || !data) {
    throw new Error("Feature row missing");
  }

  if (data[key] !== true) {
    throw new Error(`Feature disabled: ${key}`);
  }

  return data;
}

export async function audit(
  companyId: string,
  actorUserId: string | null,
  action: string,
  meta: Record<string, unknown> = {},
) {
  await supabaseAdmin.from("audit_logs").insert({
    company_id: companyId,
    actor_user_id: actorUserId,
    action,
    meta,
  });
}
