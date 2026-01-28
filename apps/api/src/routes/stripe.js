/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Stripe Checkout + Billing Portal + Webhooks
 */

const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { stripeClient, isStripeConfigured } = require("../billing/stripe");
const { env } = require("../config/env");
const { getPrisma } = require("../db/prisma");
const { authenticate, limiters } = require("../middleware/security");
const persist = require("../billing/persist");

const stripeRouter = express.Router();
const stripeWebhookRouter = express.Router();

const planCatalog = [
  {
    key: "starter",
    label: "Infæmous Freight Starter (per seat)",
    envs: ["STRIPE_STARTER_PRICE_ID", "STRIPE_PRICE_STARTER"],
  },
  {
    key: "pro",
    label: "Infæmous Freight Professional (per seat)",
    envs: ["STRIPE_PRO_PRICE_ID", "STRIPE_PRICE_PRO"],
  },
  {
    key: "enterprise",
    label: "Infæmous Freight Enterprise (per seat)",
    envs: ["STRIPE_ENTERPRISE_PRICE_ID", "STRIPE_BUSINESS_PRICE_ID", "STRIPE_PRICE_ENTERPRISE"],
  },
];

const addOnCatalog = {
  voice: {
    label: "Voice (per seat)",
    env: "STRIPE_VOICE_PRICE_ID",
    quantity: "seats",
  },
  white_label: {
    label: "White-label (flat)",
    env: "STRIPE_WHITE_LABEL_PRICE_ID",
    quantity: "flat",
  },
  analytics_export: {
    label: "Analytics export (flat)",
    env: "STRIPE_ANALYTICS_PRICE_ID",
    quantity: "flat",
  },
};

function getAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

function resolvePlanPriceId(plan) {
  const normalizedPlan = plan === "business" ? "enterprise" : plan;
  const entry = planCatalog.find((item) => item.key === normalizedPlan);
  if (!entry) return null;
  const envKey = entry.envs.find((candidate) => process.env[candidate]);
  return envKey ? process.env[envKey] : null;
}

async function getOrCreateStripeCustomer({
  stripe,
  tenantId,
  email,
  name,
}) {
  if (!stripe || !tenantId) return null;

  const entitlements = await persist.getEntitlements(tenantId);
  const existingCustomerId = entitlements?.stripe_customer_id;
  if (existingCustomerId) {
    return existingCustomerId;
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    name: name || undefined,
    metadata: { tenantId },
  });

  await persist.setEntitlement(tenantId, "stripe_customer_id", customer.id);

  return customer.id;
}

/**
 * Resolve the Stripe price ID environment variable for a given add-on key.
 * @param {string} addOnKey - Add-on key such as "voice", "white_label", or "analytics_export".
 * @returns {string|null} The Stripe price ID from environment for the add-on, or `null` if the add-on or its price ID is not configured.
 */
function resolveAddOnPriceId(addOnKey) {
  const entry = addOnCatalog[addOnKey];
  if (!entry) return null;
  return process.env[entry.env] || null;
}

async function resolvePriceIdByLookupKey(stripe, lookupKey) {
  if (!stripe || !lookupKey) return null;
  try {
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      limit: 1,
    });
    return prices.data?.[0]?.id || null;
  } catch (error) {
    // Avoid throwing raw Stripe errors from price lookup; log and return null instead.
    console.error("Failed to resolve Stripe price ID by lookup key", {
      lookupKey,
      error: error && error.message ? error.message : error,
    });
    return null;
  }
}

async function resolveAiMeteredPriceId(stripe) {
  let aiMeteredPriceId = process.env.STRIPE_AI_METERED_PRICE_ID || null;
  if (!aiMeteredPriceId && process.env.STRIPE_AI_METERED_LOOKUP_KEY) {
    aiMeteredPriceId = await resolvePriceIdByLookupKey(
      stripe,
      process.env.STRIPE_AI_METERED_LOOKUP_KEY
    );
  }

  return aiMeteredPriceId;
}

async function persistAiSubscriptionItemId({
  stripe,
  subscriptionId,
  tenantId,
}) {
  if (!stripe || !subscriptionId || !tenantId) return;

  const aiMeteredPriceId = await resolveAiMeteredPriceId(stripe);
  if (!aiMeteredPriceId) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price"],
    });

    const aiItem = subscription?.items?.data?.find(
      (item) => item?.price?.id === aiMeteredPriceId
    );

    if (!aiItem?.id) return;

    await persist.setEntitlement(
      tenantId,
      "stripe_ai_subscription_item_id",
      String(aiItem.id)
    );
  } catch (error) {
    console.error("Failed to persist AI subscription item ID", {
      tenantId,
      subscriptionId,
      error: error && error.message ? error.message : error,
    });
  }
}

/**
 * Verify that a provided usage key matches a stored usage key using a timing-safe comparison.
 * @param {string|Buffer|number} usageKey - The expected/stored usage key.
 * @param {string|Buffer|number} providedKey - The usage key supplied by the caller to validate.
 * @returns {boolean} `true` if both keys are present, have the same length, and match in a timing-safe manner; `false` otherwise.
 */
function hasValidUsageKey(usageKey, providedKey) {
  if (!usageKey || !providedKey) return false;
  const usageBuffer = Buffer.from(String(usageKey));
  const providedBuffer = Buffer.from(String(providedKey));
  if (usageBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(usageBuffer, providedBuffer);
}

/**
 * Establishes an authenticated user on the request when possible.
 *
 * Checks for an existing authenticated user, a Bearer token validated against the configured JWT secret, or an x-user-id header fallback; when authentication succeeds, attaches a `user` object with a `sub` property to `req`.
 * @param {import('express').Request} req - Express request object to inspect and mutate.
 * @returns {boolean} `true` if authentication was established and `req.user` was set or already present, `false` otherwise.
 */
function ensureAuthenticated(req) {
  if (req.user?.sub) {
    return true;
  }

  const header = req.headers.authorization || req.headers.Authorization;
  if ((!header || !header.startsWith("Bearer ")) && req.headers["x-user-id"]) {
    req.user = { sub: String(req.headers["x-user-id"]) };
    return true;
  }

  if (header && header.startsWith("Bearer ")) {
    const token = header.replace("Bearer ", "");
    const secret = process.env.JWT_SECRET || env?.jwtSecret;
    if (!secret) {
      return false;
    }
    try {
      req.user = jwt.verify(token, secret);
      return true;
    } catch (err) {
      return false;
    }
  }

  return false;
}

// --------------------------------------------
// GET /api/stripe/plans
// --------------------------------------------
stripeRouter.get("/plans", (_req, res) => {
  const plans = planCatalog.map((plan) => ({
    key: plan.key,
    label: plan.label,
    priceId: resolvePlanPriceId(plan.key),
  }));

  res.json({
    ok: true,
    configured: isStripeConfigured(),
    plans,
  });
});

// --------------------------------------------
// POST /api/stripe/customer
// --------------------------------------------
stripeRouter.post(
  "/customer",
  limiters.billing,
  authenticate,
  async (req, res) => {
    try {
      const Schema = z.object({
        email: z.string().email().optional(),
        name: z.string().optional(),
        tenantId: z.string().optional(),
      });
      const body = Schema.parse(req.body);

      const stripe = stripeClient();
      if (!stripe) {
        return res.status(400).json({
          ok: false,
          error: "Stripe not configured.",
        });
      }

      const tenantId =
        body.tenantId || req.auth?.organizationId || req.user?.sub || "";
      if (!tenantId) {
        return res.status(400).json({
          ok: false,
          error: "Missing tenantId or authenticated user.",
        });
      }

      const customerId = await getOrCreateStripeCustomer({
        stripe,
        tenantId,
        email: body.email,
        name: body.name,
      });

      return res.json({ ok: true, customerId });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || "Customer creation failed",
      });
    }
  }
);

// --------------------------------------------
// POST /api/stripe/subscription
// --------------------------------------------
stripeRouter.post(
  "/subscription",
  limiters.billing,
  authenticate,
  async (req, res) => {
    try {
      const Schema = z
        .object({
          priceId: z.string().optional(),
          plan: z.enum(["starter", "pro", "enterprise", "business"]).optional(),
          seats: z.number().int().min(1).max(500).optional().default(1),
          addOns: z
            .array(z.enum(["voice", "white_label", "analytics_export"]))
            .optional()
            .default([]),
          customerEmail: z.string().email().optional(),
          name: z.string().optional(),
          tenantId: z.string().optional(),
          includeAiMetered: z.boolean().optional().default(true),
        })
        .refine((data) => data.priceId || data.plan, {
          message: "priceId or plan is required",
        });

      const body = Schema.parse(req.body);

      const stripe = stripeClient();
      if (!stripe) {
        return res.status(400).json({
          ok: false,
          error:
            "Stripe not configured. Set STRIPE_SECRET_KEY and price ID env vars.",
        });
      }

      const tenantId =
        body.tenantId || req.auth?.organizationId || req.user?.sub || "";
      if (!tenantId) {
        return res.status(400).json({
          ok: false,
          error: "Missing tenantId or authenticated user.",
        });
      }

      const customerId = await getOrCreateStripeCustomer({
        stripe,
        tenantId,
        email: body.customerEmail,
        name: body.name,
      });

      if (!customerId) {
        return res.status(400).json({
          ok: false,
          error: "Unable to resolve Stripe customer.",
        });
      }

      const lineItems = [];

      if (body.priceId) {
        lineItems.push({ price: body.priceId, quantity: 1 });
      } else if (body.plan) {
        const planPriceId = resolvePlanPriceId(body.plan);
        if (!planPriceId) {
          return res.status(400).json({
            ok: false,
            error: `Missing price ID for plan ${body.plan}.`,
          });
        }

        lineItems.push({ price: planPriceId, quantity: body.seats });

        for (const addOn of body.addOns) {
          const addOnPriceId = resolveAddOnPriceId(addOn);
          if (!addOnPriceId) {
            return res.status(400).json({
              ok: false,
              error: `Missing price ID for add-on ${addOn}.`,
            });
          }
          const quantity =
            addOnCatalog[addOn].quantity === "seats" ? body.seats : 1;
          lineItems.push({ price: addOnPriceId, quantity });
        }

        const aiMeteredPriceId = await resolveAiMeteredPriceId(stripe);
        if (body.includeAiMetered && aiMeteredPriceId) {
          lineItems.push({ price: aiMeteredPriceId, quantity: 1 });
        }
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: lineItems,
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent", "items.data.price"],
        metadata: {
          tenantId,
          plan: body.plan || "custom",
          seats: String(body.seats || 1),
          addOns: body.addOns?.join(",") || "",
        },
      });

      const paymentIntent = subscription.latest_invoice?.payment_intent;
      const clientSecret = paymentIntent?.client_secret || null;

      await persist.upsertSubscription({
        userId: tenantId,
        customerId,
        subscriptionId: subscription.id,
        priceId: subscription.items?.data?.[0]?.price?.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      });

      await persistAiSubscriptionItemId({
        stripe,
        subscriptionId: subscription.id,
        tenantId,
      });

      return res.json({
        ok: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        clientSecret,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || "Subscription creation failed",
      });
    }
  }
);

// --------------------------------------------
// POST /api/stripe/checkout
// --------------------------------------------
stripeRouter.post(
  "/checkout",
  limiters.billing,
  authenticate,
  async (req, res) => {
    try {
      const Schema = z.object({
        plan: z.enum(["starter", "pro", "enterprise", "business"]),
        seats: z.number().int().min(1).max(500).optional().default(1),
        addOns: z
          .array(z.enum(["voice", "white_label", "analytics_export"]))
          .optional()
          .default([]),
        customerEmail: z.string().email().optional(),
        tenantId: z.string().optional(),
        includeAiMetered: z.boolean().optional().default(true),
      });
      const body = Schema.parse(req.body);

      const stripe = stripeClient();
      if (!stripe) {
        return res.status(400).json({
          ok: false,
          error:
            "Stripe not configured. Set STRIPE_SECRET_KEY and price ID env vars.",
        });
      }

      const planPriceId = resolvePlanPriceId(body.plan);
      if (!planPriceId) {
        return res.status(400).json({
          ok: false,
          error: `Missing price ID for plan ${body.plan}.`,
        });
      }

      const lineItems = [{ price: planPriceId, quantity: body.seats }];

      for (const addOn of body.addOns) {
        const addOnPriceId = resolveAddOnPriceId(addOn);
        if (!addOnPriceId) {
          return res.status(400).json({
            ok: false,
            error: `Missing price ID for add-on ${addOn}.`,
          });
        }
        const quantity =
          addOnCatalog[addOn].quantity === "seats" ? body.seats : 1;
        lineItems.push({ price: addOnPriceId, quantity });
      }

      const aiMeteredPriceId = await resolveAiMeteredPriceId(stripe);

      if (body.includeAiMetered && aiMeteredPriceId) {
        lineItems.push({
          price: aiMeteredPriceId,
          quantity: 1,
        });
      }

      const tenantId =
        body.tenantId || req.auth?.organizationId || req.user?.sub || "";

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: body.customerEmail,
        line_items: lineItems,
        success_url: `${getAppUrl()}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${getAppUrl()}/billing/cancel`,
        subscription_data: {
          metadata: {
            tenantId,
            plan: body.plan,
            seats: String(body.seats),
            addOns: body.addOns.join(","),
          },
        },
        metadata: {
          tenantId,
          plan: body.plan,
          seats: String(body.seats),
          addOns: body.addOns.join(","),
        },
      });

      return res.json({ ok: true, url: session.url });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || "Checkout failed",
      });
    }
  }
);

// --------------------------------------------
// POST /api/stripe/portal
// --------------------------------------------
stripeRouter.post(
  "/portal",
  limiters.billing,
  authenticate,
  async (req, res) => {
    try {
      const Schema = z.object({ customerId: z.string().min(1) });
      const body = Schema.parse(req.body);

      const stripe = stripeClient();
      if (!stripe) {
        return res.status(400).json({
          ok: false,
          error: "Stripe not configured.",
        });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: body.customerId,
        return_url: `${getAppUrl()}/billing`,
      });

      return res.json({ ok: true, url: session.url });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || "Portal failed",
      });
    }
  }
);

// --------------------------------------------
// POST /api/stripe/report-usage
// --------------------------------------------
stripeRouter.post("/report-usage", limiters.billing, async (req, res) => {
  try {
    const usageKey = process.env.STRIPE_USAGE_REPORT_KEY;
    const providedKey = req.headers["x-usage-report-key"];
    const hasUsageKey = hasValidUsageKey(usageKey, providedKey);
    const isAuthenticated = hasUsageKey || ensureAuthenticated(req);
    if (!hasUsageKey && !isAuthenticated) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const Schema = z.object({
      subscriptionItemId: z.string().min(1),
      quantity: z.number().int().positive(),
      timestamp: z.number().int().optional(),
      tenantId: z.string().optional(),
    });
    const body = Schema.parse(req.body);

    const stripe = stripeClient();
    if (!stripe) {
      return res.status(400).json({
        ok: false,
        error: "Stripe not configured.",
      });
    }

    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      body.subscriptionItemId,
      {
        quantity: body.quantity,
        timestamp: body.timestamp || Math.floor(Date.now() / 1000),
        action: "increment",
      }
    );

    const prisma = getPrisma();
    const tenantId = body.tenantId || req.auth?.organizationId || req.user?.sub;
    if (prisma && tenantId) {
      try {
        await prisma.aiUsageRecord.create({
          data: {
            tenantId,
            stripeSubscriptionItemId: body.subscriptionItemId,
            quantity: body.quantity,
            stripeUsageRecordId: usageRecord.id,
          },
        });
      } catch (dbErr) {
        // Avoid failing the whole request if audit logging fails after Stripe usage was recorded.
        // Log a warning so operators can reconcile Stripe records with missing audit entries.
        console.warn("Failed to persist AI usage audit record", {
          error: dbErr && dbErr.message ? dbErr.message : dbErr,
          tenantId,
          stripeSubscriptionItemId: body.subscriptionItemId,
          quantity: body.quantity,
          stripeUsageRecordId: usageRecord.id,
        });
      }
    }

    return res.json({ ok: true, usageRecordId: usageRecord.id });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Usage reporting failed",
    });
  }
});

// --------------------------------------------
// POST /api/stripe/invoice
// --------------------------------------------
stripeRouter.post(
  "/invoice",
  limiters.billing,
  authenticate,
  async (req, res) => {
    try {
      const Schema = z.object({
        customerId: z.string().min(1),
        lines: z.array(
          z.object({
            amountCents: z.number().int().positive(),
            currency: z.string().min(3),
            description: z.string().min(1),
          })
        ),
        autoAdvance: z.boolean().optional().default(true),
      });
      const body = Schema.parse(req.body);

      const stripe = stripeClient();
      if (!stripe) {
        return res.status(400).json({
          ok: false,
          error: "Stripe not configured.",
        });
      }

      for (const line of body.lines) {
        await stripe.invoiceItems.create({
          customer: body.customerId,
          amount: line.amountCents,
          currency: line.currency,
          description: line.description,
        });
      }

      const invoice = await stripe.invoices.create({
        customer: body.customerId,
        auto_advance: body.autoAdvance,
        collection_method: "charge_automatically",
      });

      return res.json({
        ok: true,
        invoiceId: invoice.id,
        status: invoice.status,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || "Invoice creation failed",
      });
    }
  }
);

// --------------------------------------------
// POST /api/stripe/webhook (raw body)
// --------------------------------------------
stripeWebhookRouter.post(
  "/webhook",
  limiters.webhook,
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const stripe = stripeClient();
    if (!stripe) {
      return res.status(400).json({ ok: false, error: "Stripe not configured." });
    }

    const sig = req.headers["stripe-signature"];
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({
        ok: false,
        error: "Missing Stripe webhook signature or secret.",
      });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res
        .status(400)
        .send(`Webhook Error: ${err?.message || "Invalid signature"}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const tenantId =
            session.metadata?.tenantId || session.client_reference_id || "";
          const plan = session.metadata?.plan || "unknown";
          const seats = session.metadata?.seats || "1";
          const addOns = session.metadata?.addOns || "";

          if (tenantId) {
            await persist.setEntitlement(tenantId, "plan", String(plan));
            await persist.setEntitlement(tenantId, "seats", String(seats));
            await persist.setEntitlement(tenantId, "add_ons", String(addOns));
            await persist.setEntitlement(tenantId, "stripe_status", "active");
            await persist.setEntitlement(
              tenantId,
              "stripe_customer_id",
              String(session.customer || "")
            );
            await persist.setEntitlement(
              tenantId,
              "stripe_subscription_id",
              String(session.subscription || "")
            );
            await persistAiSubscriptionItemId({
              stripe,
              subscriptionId: session.subscription,
              tenantId,
            });
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const tenantId = subscription.metadata?.tenantId || "";
          if (tenantId) {
            await persist.setEntitlement(
              tenantId,
              "stripe_status",
              String(subscription.status)
            );
            if (subscription.metadata?.plan) {
              await persist.setEntitlement(
                tenantId,
                "plan",
                String(subscription.metadata.plan)
              );
            }
            await persistAiSubscriptionItemId({
              stripe,
              subscriptionId: subscription.id,
              tenantId,
            });
          }
          break;
        }
        case "invoice.finalized":
        case "invoice.paid": {
          const invoice = event.data.object;
          let tenantId = invoice.metadata?.tenantId || "";

          if (!tenantId && invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              String(invoice.subscription)
            );
            tenantId = subscription.metadata?.tenantId || "";
          }

          if (tenantId) {
            await persist.setEntitlement(
              tenantId,
              "last_invoice_status",
              String(invoice.status)
            );
            if (invoice.status === "paid") {
              await persist.setEntitlement(tenantId, "stripe_status", "active");
            }
          }
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object;
          let tenantId = invoice.metadata?.tenantId || "";

          if (!tenantId && invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              String(invoice.subscription)
            );
            tenantId = subscription.metadata?.tenantId || "";
          }

          if (tenantId) {
            await persist.setEntitlement(
              tenantId,
              "stripe_status",
              "past_due"
            );
            await persist.setEntitlement(
              tenantId,
              "last_invoice_status",
              String(invoice.status)
            );
          }
          break;
        }
        default:
          break;
      }

      return res.json({ received: true });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || "Webhook handling failed",
      });
    }
  }
);

module.exports = { stripeRouter, stripeWebhookRouter };
