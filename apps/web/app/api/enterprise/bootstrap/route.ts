import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { companyName, ownerUserId } = await req.json();
  if (!companyName || !ownerUserId) {
    return NextResponse.json({ error: "companyName and ownerUserId required" }, { status: 400 });
  }

  const { data: company, error } = await supabaseAdmin
    .from("companies")
    .insert({ name: companyName })
    .select("*")
    .single();
  if (error || !company) {
    return NextResponse.json({ error: error?.message ?? "Company create failed" }, { status: 500 });
  }

  await supabaseAdmin
    .from("company_memberships")
    .insert({ company_id: company.id, user_id: ownerUserId, role: "owner" });
  await supabaseAdmin.from("company_features").insert({ company_id: company.id });
  await supabaseAdmin.from("company_billing").insert({
    company_id: company.id,
    status: "trial",
    plan_key: "fleet",
    seats: 1,
    ai_included: 500,
    ai_overage: 0.008,
    ai_hard_cap_multiplier: 2,
    ai_hard_capped: false,
  });

  return NextResponse.json({ ok: true, companyId: company.id });
}
