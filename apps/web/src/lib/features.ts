import { supabaseAdmin } from "./supabase";

export type FeatureFlagKey =
  | "enable_ai"
  | "enable_ai_automation"
  | "enable_marketplace"
  | "enable_checkout";

export async function requireFeature(companyId: string, key: FeatureFlagKey) {
  const { data, error } = await supabaseAdmin
    .from("company_features")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (error) {
    throw new Error(`Failed to load feature flags: ${error.message}`);
  }
  if (!data || data[key] !== true) {
    throw new Error(`Feature ${key} disabled`);
  }
}
