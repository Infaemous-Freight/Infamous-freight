import { NextRequest } from "next/server";
import { requireActiveBilling } from "@/lib/billing";
import { requireFeature } from "@/lib/features";
import { recordAiAction } from "@/lib/ai-usage";

export async function POST(req: NextRequest) {
  const { companyId } = (await req.json()) as { companyId?: string };

  if (!companyId) {
    return Response.json({ ok: false, error: "Missing companyId" }, { status: 400 });
  }

  await requireActiveBilling(companyId);
  await requireFeature(companyId, "enable_ai");

  const usage = await recordAiAction(companyId, 1);

  return Response.json({ ok: true, usage });
}
