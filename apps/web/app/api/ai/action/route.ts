import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { recordAiActionsAndReport } from "@/lib/ai-usage";

export const runtime = "nodejs";

const Body = z.object({ actions: z.number().int().min(1).max(100).default(1) });

export async function POST(req: Request) {
  const rl = rateLimit(`ai:${req.headers.get("x-forwarded-for") ?? "local"}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited", retryAfterMs: rl.retryAfterMs },
      { status: 429 },
    );
  }

  const { user, activeCompanyId } = await requireActiveCompany(req);
  const { actions } = Body.parse(await req.json());

  const { data: billing } = await supabaseAdmin
    .from("company_billing")
    .select("*")
    .eq("company_id", activeCompanyId)
    .single();
  if (!billing || billing.status !== "active") {
    return NextResponse.json({ error: "Billing not active" }, { status: 402 });
  }

  const { data: features } = await supabaseAdmin
    .from("company_features")
    .select("*")
    .eq("company_id", activeCompanyId)
    .single();
  if (!features?.enable_ai) {
    return NextResponse.json({ error: "AI disabled" }, { status: 403 });
  }
  if (!features?.enable_ai_automation) {
    return NextResponse.json({ error: "AI automation paused" }, { status: 403 });
  }

  try {
    const usage = await recordAiActionsAndReport(activeCompanyId, actions, user.id);
    return NextResponse.json({ ok: true, usage });
  } catch (e: any) {
    await supabaseAdmin.from("audit_logs").insert({
      company_id: activeCompanyId,
      actor_user_id: user.id,
      action: "ai.action.blocked",
      meta: { reason: e.message },
    });
    return NextResponse.json({ error: e.message }, { status: 402 });
  }
}
