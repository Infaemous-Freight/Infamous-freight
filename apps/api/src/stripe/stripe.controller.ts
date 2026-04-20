import type { NextFunction, Request, Response } from "express";
import { stripeService } from "./stripe.service.js";

type CheckoutBody = {
  tenantId?: string;
  customerEmail?: string;
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
  idempotencyKey?: string;
};

export async function createCheckoutSessionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = (req.body ?? {}) as CheckoutBody;

    if (!body.tenantId || !body.customerEmail || !body.priceId || !body.successUrl || !body.cancelUrl || !body.idempotencyKey) {
      res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
      return;
    }

    const checkout = await stripeService.createSubscriptionCheckout({
      tenantId: body.tenantId,
      customerEmail: body.customerEmail,
      priceId: body.priceId,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
      idempotencyKey: body.idempotencyKey,
    });

    res.status(200).json({
      success: true,
      data: checkout,
    });
  } catch (error) {
    next(error);
  }
}

export async function stripeWebhookController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const signature = req.headers["stripe-signature"];
    const normalizedSignature = Array.isArray(signature) ? signature[0] : signature;

    if (!stripeService.validateWebhookSignature(normalizedSignature)) {
      res.status(400).json({ success: false, error: "Invalid webhook signature" });
      return;
    }

    res.status(200).json({ success: true, received: true });
  } catch (error) {
    next(error);
  }
}
