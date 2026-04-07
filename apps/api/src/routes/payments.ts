import { Router } from "express";
import { z } from "zod";
import { PAYMENT_LINKS } from "@infamous-freight/shared";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { requirePermission } from "../middleware/authorization.js";
import { ApiError } from "../utils/errors.js";
import {
  createGoDaddyRedirectPayment,
  createStripePaymentIntent,
} from "../services/payment.service.js";

const router: Router = Router();

const createGoDaddyCheckoutSchema = z.object({
  type: z.enum(
    Object.keys(PAYMENT_LINKS) as [
      keyof typeof PAYMENT_LINKS,
      ...Array<keyof typeof PAYMENT_LINKS>,
    ],
  ),
  amount: z
    .number()
    .positive()
    .refine((value) => Number.isInteger(value * 100), {
      message: "Amount must have at most two decimal places",
    }),
  loadId: z.string().optional(),
});

const createStripeIntentSchema = z.object({
  amount: z
    .number()
    .positive()
    .refine((value) => Number.isInteger(value * 100), {
      message: "Amount must have at most two decimal places",
    }),
  currency: z.string().default("usd"),
  loadId: z.string().optional(),
});

router.post("/godaddy/checkout", requireAuth, async (req, res, next) => {
  try {
    const { tenantId, id: userId } = (req as AuthenticatedRequest).user!;
    const body = createGoDaddyCheckoutSchema.parse(req.body);

    if (!tenantId) {
      res.status(400).json({ ok: false, error: "Missing tenant context" });
      return;
    }

    const result = await createGoDaddyRedirectPayment({
      tenantId,
      userId,
      loadId: body.loadId,
      type: body.type,
      amount: body.amount,
    });

    res.status(201).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/stripe/payment-intent",
  requireAuth,
  requirePermission("billing:update"),
  async (req, res, next) => {
  try {
    const { tenantId, id: userId } = (req as AuthenticatedRequest).user!;
    const body = createStripeIntentSchema.parse(req.body);

    if (!tenantId) {
      throw new ApiError(400, "TENANT_CONTEXT_REQUIRED", "Missing tenant context");
    }
    const idempotencyKey = req.header("idempotency-key");
    if (!idempotencyKey) {
      throw new ApiError(400, "IDEMPOTENCY_KEY_REQUIRED", "idempotency-key header is required");
    }

    const result = await createStripePaymentIntent({
      tenantId,
      userId,
      loadId: body.loadId,
      amount: body.amount,
      currency: body.currency,
      idempotencyKey,
    });

    res.status(201).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
  },
);

export default router;
