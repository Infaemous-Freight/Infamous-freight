import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { requireRole } from '../middleware/rbac.js';
import { createPaymentIntentForInvoice, handleStripeWebhookEvent } from '../integrations/stripe/stripe.billing.js';
import { env } from '../env.js';
import { stripe } from '../integrations/stripe/stripe.client.js';

export const stripeRoutes = Router();

stripeRoutes.post(
  '/payment-intent/:invoiceId',
  requireAuth,
  requireTenant,
  requireRole(['OWNER', 'ADMIN', 'FINANCE', 'SHIPPER', 'BROKER']),
  async (req, res) => {
    try {
      const out = await createPaymentIntentForInvoice(req.orgId!, req.params.invoiceId);
      res.json(out);
    } catch (e: any) {
      res.status(400).json({ error: e.message ?? 'Failed' });
    }
  }
);

// Stripe webhook: MUST use raw body, so we read it from req.rawBody (set in server)
stripeRoutes.post('/webhook', async (req, res) => {
  try {
    if (!stripe) return res.status(200).json({ ok: true, skipped: 'Stripe not configured' });
    if (!env.STRIPE_WEBHOOK_SECRET) throw new Error('Missing STRIPE_WEBHOOK_SECRET');

    const sig = req.headers['stripe-signature'];
    if (!sig || typeof sig !== 'string') throw new Error('Missing stripe-signature header');

    const raw = (req as any).rawBody as Buffer | undefined;
    if (!raw) throw new Error('Missing rawBody');

    const event = stripe.webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
    await handleStripeWebhookEvent(event);

    res.json({ received: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? 'Webhook error' });
  }
});
