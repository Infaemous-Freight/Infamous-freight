import { NextRequest } from "next/server";
import { requireActiveBilling } from "@/lib/billing";
import { requireFeature } from "@/lib/features";
import { recordAiAction } from "@/lib/ai-usage";

export async function POST(req: NextRequest) {
  const { companyId } = (await req.json()) as { companyId?: string };

  if (!companyId) {
    return Response.json({ ok: false, error: "Missing companyId" }, { status: 400 });
  }

  try {
    await requireActiveBilling(companyId);
    await requireFeature(companyId, "enable_ai");

    const usage = await recordAiAction(companyId, 1);

    return Response.json({ ok: true, usage });
  } catch (error: unknown) {
    let status = 500;
    let message = "Internal Server Error";

    if (error instanceof Error && error.message) {
      message = error.message;
    }

    const anyError = error as any;

    if (typeof anyError?.status === "number") {
      status = anyError.status;
    } else if (typeof anyError?.statusCode === "number") {
      status = anyError.statusCode;
    } else if (anyError?.code === "BILLING_REQUIRED" || anyError?.code === "BILLING_INACTIVE") {
      status = 402; // Payment Required - billing issues
    } else if (anyError?.code === "FEATURE_UNAVAILABLE" || anyError?.code === "FEATURE_DISABLED") {
      status = 403; // Forbidden - feature access issues
    } else if (anyError?.code === "AI_HARD_CAP_REACHED" || anyError?.code === "RATE_LIMITED") {
      status = 429; // Too Many Requests - hard cap / rate limit reached
    }

    return Response.json({ ok: false, error: message }, { status });
  }
}
