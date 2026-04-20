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

function readHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export async function createCheckoutSessionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!stripeService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: "Stripe billing is not configured",
      });
      return;
    }

    const body = (req.body ?? {}) as CheckoutBody;
    const headerIdempotencyKey = readHeaderValue(req.headers["idempotency-key"]);
    const idempotencyKey = body.idempotencyKey ?? headerIdempotencyKey;

    if (!body.tenantId || !body.customerEmail || !body.priceId || !body.successUrl || !body.cancelUrl || !idempotencyKey) {
      res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
      return;
    }

    const authTenantId = req.auth?.organizationId ?? req.auth?.orgId;
    if (authTenantId && body.tenantId !== authTenantId) {
      res.status(403).json({
        success: false,
        error: "Tenant mismatch",
      });
      return;
    }

    const checkout = await stripeService.createSubscriptionCheckout({
      tenantId: body.tenantId,
      customerEmail: body.customerEmail,
      priceId: body.priceId,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
      idempotencyKey,
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
    if (!stripeService.isConfigured()) {
      res.status(503).json({ success: false, error: "Stripe billing is not configured" });
      return;
    }

    const normalizedSignature = readHeaderValue(req.headers["stripe-signature"]);

    if (!stripeService.validateWebhookSignature(normalizedSignature)) {
      res.status(400).json({ success: false, error: "Invalid webhook signature" });
      return;
    }

    res.status(200).json({ success: true, received: true });
  } catch (error) {
    next(error);
  }
}
