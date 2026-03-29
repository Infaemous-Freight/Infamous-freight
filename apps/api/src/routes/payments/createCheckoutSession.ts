import type { Request, Response } from "express";
import { PaymentService } from "../../services/payments/payment.service.js";

const paymentService = new PaymentService();

export async function createCheckoutSession(req: Request, res: Response) {
  try {
    // Derive auth / org context from authenticated user on the request
    const authUser = (req as any).user;
    const orgId: string | undefined =
      authUser?.orgId ??
      authUser?.organizationId ??
      authUser?.tenantId ??
      (req.headers["x-org-id"] as string | undefined);
    const userId: string | undefined =
      authUser?.id ??
      authUser?.sub ??
      (req.headers["x-user-id"] as string | undefined);
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

    if (!session.url) {
      console.error("createCheckoutSession error: missing session URL", {
        sessionId: (session as any).id,
      });
      return res
        .status(502)
        .json({ error: "Checkout session missing redirect URL" });
    }
    return res.json({ url: session.url });
  } catch (error) {
    console.error("createCheckoutSession error", error);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
