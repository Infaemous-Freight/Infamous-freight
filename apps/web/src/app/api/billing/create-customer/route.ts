import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureStripeCustomer } from "@/lib/billing";
import { jsonWithRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { user, activeCompanyId } = await requireActiveCompany(req);

    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("name")
      .eq("id", activeCompanyId)
      .single();

    const stripeCustomerId = await ensureStripeCustomer(
      activeCompanyId,
      company?.name ?? "Infæmous Freight Company",
    );

    await supabaseAdmin.from("audit_logs").insert({
      company_id: activeCompanyId,
      actor_user_id: user.id,
      action: "billing.stripe_customer.created_or_exists",
      meta: { stripeCustomerId },
    });

    return jsonWithRequestId(req, { ok: true, stripeCustomerId });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create or retrieve Stripe customer";

    return jsonWithRequestId(req, {
      ok: false,
      error: message,
    });
  }
}
