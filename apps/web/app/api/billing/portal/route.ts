import { NextResponse } from "next/server";
import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { activeCompanyId } = await requireActiveCompany(req);
  const { data: billing } = await supabaseAdmin
    .from("company_billing")
    .select("stripe_customer_id")
    .eq("company_id", activeCompanyId)
    .single();
  if (!billing?.stripe_customer_id) {
    return NextResponse.json({ error: "No stripe customer" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${appUrl}/dispatch`,
  });
  return NextResponse.json({ ok: true, url: session.url });
}
