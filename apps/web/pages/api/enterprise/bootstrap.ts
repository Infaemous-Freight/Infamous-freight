import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ENTERPRISE_DEFAULTS } from "@/lib/enterprise";

type ResponseData = {
  ok?: boolean;
  companyId?: string;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { companyName, ownerUserId } = req.body ?? {};

  const trimmedCompanyName =
    typeof companyName === "string" ? companyName.trim() : "";

  if (typeof ownerUserId !== "string" || !ownerUserId.trim()) {
    return res.status(400).json({ error: "companyName and ownerUserId required" });
  }

  // Validate companyName: non-empty, reasonable length, and safe characters
  const COMPANY_NAME_MIN_LENGTH = 2;
  const COMPANY_NAME_MAX_LENGTH = 100;
  const companyNamePattern = /^[a-zA-Z0-9 .,&'_-]+$/;

  if (
    !trimmedCompanyName ||
    trimmedCompanyName.length < COMPANY_NAME_MIN_LENGTH ||
    trimmedCompanyName.length > COMPANY_NAME_MAX_LENGTH ||
    !companyNamePattern.test(trimmedCompanyName)
  ) {
    return res.status(400).json({
      error:
        "Invalid companyName: must be 2-100 characters and contain only letters, numbers, spaces, and . , & ' _ - characters",
    });
  }

  const { data: company, error: companyError } = await supabaseAdmin
    .from("companies")
    .insert({ name: trimmedCompanyName })
    .select("*")
    .single();

  if (companyError || !company) {
    return res.status(500).json({ error: companyError?.message ?? "Company create failed" });
  }

  const { error: membershipError } = await supabaseAdmin
    .from("company_memberships")
    .insert({
      company_id: company.id,
      user_id: ownerUserId,
      role: "owner",
    });

  if (membershipError) {
    // Best-effort cleanup of the created company if membership creation fails
    await supabaseAdmin.from("companies").delete().eq("id", company.id);
    return res.status(500).json({ error: membershipError.message ?? "Company membership create failed" });
  }

  const { error: featuresError } = await supabaseAdmin
    .from("company_features")
    .insert({ company_id: company.id });

  if (featuresError) {
    // Best-effort cleanup of prior records if feature creation fails
    await supabaseAdmin.from("company_memberships").delete().eq("company_id", company.id);
    await supabaseAdmin.from("companies").delete().eq("id", company.id);
    return res.status(500).json({ error: featuresError.message ?? "Company features create failed" });
  }

  const { error: billingError } = await supabaseAdmin
    .from("company_billing")
    .insert({
      company_id: company.id,
      status: "trial",
      ...ENTERPRISE_DEFAULTS,
    });

  if (billingError) {
    // Best-effort cleanup of prior records if billing creation fails
    await supabaseAdmin.from("company_features").delete().eq("company_id", company.id);
    await supabaseAdmin.from("company_memberships").delete().eq("company_id", company.id);
    await supabaseAdmin.from("companies").delete().eq("id", company.id);
    return res.status(500).json({ error: billingError.message ?? "Company billing create failed" });
  }
  return res.status(200).json({ ok: true, companyId: company.id });
}
