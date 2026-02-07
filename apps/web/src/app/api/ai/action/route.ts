import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { recordAiActionsAndReport } from "@/lib/ai-usage";
import { jsonWithRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

const Body = z.object({ actions: z.number().int().min(1).max(100).default(1) });

export async function POST(req: Request) {
  try {
    const rl = rateLimit(`ai:${req.headers.get("x-forwarded-for") ?? "local"}`, 120, 60_000);
    if (!rl.ok) {
      return jsonWithRequestId(
        req,
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
      return jsonWithRequestId(req, { error: "Billing not active" }, { status: 402 });
    }

    const { data: features } = await supabaseAdmin
      .from("company_features")
      .select("*")
      .eq("company_id", activeCompanyId)
      .single();
    if (!features?.enable_ai) {
      return jsonWithRequestId(req, { error: "AI disabled" }, { status: 403 });
    }
    if (!features?.enable_ai_automation) {
      return jsonWithRequestId(req, { error: "AI automation paused" }, { status: 403 });
    }

    try {
      const usage = await recordAiActionsAndReport(activeCompanyId, actions, user.id);
      return jsonWithRequestId(req, { ok: true, companyId: activeCompanyId, usage });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "AI action blocked";
      await supabaseAdmin.from("audit_logs").insert({
        company_id: activeCompanyId,
        actor_user_id: user.id,
        action: "ai.action.blocked",
        meta: { reason: message },
      });
      return jsonWithRequestId(req, { error: message }, { status: 402 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return jsonWithRequestId(req, { error: message }, { status: 500 });
  }
}
