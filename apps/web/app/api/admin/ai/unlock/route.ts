import { NextResponse } from "next/server";
import { requireActiveCompany, requireUser } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser(req);
  const { activeCompanyId } = await requireActiveCompany(req);

  const { data: mem } = await supabaseAdmin
    .from("company_memberships")
    .select("role")
    .eq("company_id", activeCompanyId)
    .eq("user_id", user.id)
    .single();

  if (!mem || !["owner", "admin"].includes(mem.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  return NextResponse.json({ ok: true });
}
