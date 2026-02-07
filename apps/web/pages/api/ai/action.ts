import type { NextApiRequest, NextApiResponse } from "next";
import { requireCompany, requireActiveBilling, requireFeature } from "@/lib/gating";
import { recordAiActions } from "@/lib/ai-usage";

type ResponseData = {
  ok?: boolean;
  usage?: {
    used: number;
    included: number;
    pct: number;
  };
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { companyId, actorUserId, actions = 1 } = req.body ?? {};
    await requireCompany(companyId);

    await requireActiveBilling(companyId);
    await requireFeature(companyId, "enable_ai");
    await requireFeature(companyId, "enable_ai_automation");

    const rawActions = actions ?? 1;
    const parsedActions = Number(rawActions);

    if (
      !Number.isFinite(parsedActions) ||
      !Number.isInteger(parsedActions) ||
      parsedActions < 1 ||
      parsedActions > 1000
    ) {
      return res
        .status(400)
        .json({ error: "Invalid 'actions' value. Must be an integer between 1 and 1000." });
    }

    const usage = await recordAiActions(companyId, parsedActions, actorUserId ?? null);
    return res.status(200).json({ ok: true, usage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(400).json({ error: message });
  }
}
