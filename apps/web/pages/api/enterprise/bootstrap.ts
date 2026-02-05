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

  if (!companyName || !ownerUserId) {
    return res.status(400).json({ error: "companyName and ownerUserId required" });
  }

  const { data: company, error: companyError } = await supabaseAdmin
    .from("companies")
    .insert({ name: companyName })
    .select("*")
    .single();

  if (companyError || !company) {
    return res.status(500).json({ error: companyError?.message ?? "Company create failed" });
  }

  await supabaseAdmin.from("company_memberships").insert({
    company_id: company.id,
    user_id: ownerUserId,
    role: "owner",
  });

  await supabaseAdmin.from("company_features").insert({ company_id: company.id });

  await supabaseAdmin.from("company_billing").insert({
    company_id: company.id,
    status: "trial",
    ...ENTERPRISE_DEFAULTS,
  });

  return res.status(200).json({ ok: true, companyId: company.id });
}
