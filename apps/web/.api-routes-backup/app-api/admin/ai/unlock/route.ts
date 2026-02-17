import { requireActiveCompany, requireUser } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { jsonWithRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const { activeCompanyId } = await requireActiveCompany(req);

    const { data: membership } = await supabaseAdmin
      .from("company_memberships")
      .select("role")
      .eq("company_id", activeCompanyId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return jsonWithRequestId(req, { error: "Forbidden" }, { status: 403 });
    }

    await supabaseAdmin
      .from("company_billing")
      .update({ ai_hard_capped: false })
      .eq("company_id", activeCompanyId);
    await supabaseAdmin.from("audit_logs").insert({
      company_id: activeCompanyId,
      actor_user_id: user.id,
      action: "billing.overage_approved_unlock",
      meta: {},
    });

    return jsonWithRequestId(req, { ok: true });
  } catch (error) {
    // Log the error for observability; avoid leaking details to the client
     
    console.error("Failed to unlock AI overage for company", {
      error,
    });

    return jsonWithRequestId(req, { error: "Internal Server Error" }, { status: 500 });
  }
}
