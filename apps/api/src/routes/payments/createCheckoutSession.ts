import type { Request, Response } from "express";
import { PaymentService } from "../../services/payments/payment.service.js";

const paymentService = new PaymentService();

export async function createCheckoutSession(req: Request, res: Response) {
  try {
    // Derive auth / org context from authenticated user on the request
    const authUser = (req as any).user;

    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orgId: string | undefined =
      authUser.orgId ?? authUser.organizationId ?? authUser.tenantId;
    const userId: string | undefined = authUser.id;
    if (!orgId) {
      return res.status(400).json({ error: "Missing org context" });
    }

    const { loadId, amountCents, customerEmail, paymentType } = req.body;

    if (!loadId || !amountCents || !paymentType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = await paymentService.createCheckoutSession({
      orgId,
      userId,
      loadId,
      amountCents,
      customerEmail,
      paymentType,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("createCheckoutSession error", error);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
