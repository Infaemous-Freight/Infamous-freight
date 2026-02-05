import { supabaseAdmin } from "./supabase";

export async function requireActiveBilling(companyId: string) {
  const { data } = await supabaseAdmin
    .from("company_billing")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (!data || data.status !== "active") {
    throw new Error("Billing not active");
  }

  return data;
}
