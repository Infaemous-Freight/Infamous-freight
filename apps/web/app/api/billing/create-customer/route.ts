import { NextResponse } from "next/server";
import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureStripeCustomer } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { user, activeCompanyId } = await requireActiveCompany(req);
  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("name")
    .eq("id", activeCompanyId)
    .single();
  const stripeCustomerId = await ensureStripeCustomer(activeCompanyId, company?.name ?? "Company");

  await supabaseAdmin.from("audit_logs").insert({
    company_id: activeCompanyId,
    actor_user_id: user.id,
    action: "billing.stripe_customer.created_or_exists",
    meta: { stripeCustomerId },
  });

  return NextResponse.json({ ok: true, stripeCustomerId });
}
