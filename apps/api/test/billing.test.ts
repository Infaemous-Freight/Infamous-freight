import crypto from 'crypto';
import request from 'supertest';
import { createApp } from '../src/app';

function createStripeSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex');

  return `t=${timestamp},v1=${digest}`;
}

describe('Stripe billing endpoints', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    delete process.env.STRIPE_SECRET_KEY;
  });

  it('rejects webhook requests with invalid Stripe signatures', async () => {
    const app = createApp();

    await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 't=123,v1=bad')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ id: 'evt_bad', type: 'invoice.payment_failed', data: { object: {} } }))
      .expect(400);
  });

  it('accepts signed checkout webhook events and syncs billing in memory store', async () => {
    const app = createApp();
    const payload = JSON.stringify({
      id: 'evt_checkout_completed',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test_123',
          metadata: {
            carrierId: 'carrier_billing_123',
            plan: 'professional',
          },
        },
      },
    });

    await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', createStripeSignature(payload, 'whsec_test_secret'))
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(200, { received: true });

    const statusResponse = await request(app)
      .get('/api/billing/status')
      .set('x-tenant-id', 'carrier_billing_123')
      .set('x-user-role', 'owner')
      .set('x-subscription-status', 'active')
      .expect(200);

    expect(statusResponse.body.data).toMatchObject({
      stripeCustomerId: 'cus_test_123',
      hasStripeCustomer: true,
    });

    const response = await request(app)
      .post('/api/billing/customer-portal')
      .set('x-tenant-id', 'carrier_billing_123')
      .set('x-user-role', 'owner')
      .set('x-subscription-status', 'active')
      .send({})
      .expect(500);

    expect(response.body.error).toBe('stripe_secret_key_required');
  });

  it('blocks duplicate checkout when a carrier already has a Stripe customer', async () => {
    const app = createApp();
    const payload = JSON.stringify({
      id: 'evt_checkout_duplicate_guard',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_duplicate_guard',
          metadata: {
            carrierId: 'carrier_duplicate_guard',
            plan: 'starter',
          },
        },
      },
    });

    await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', createStripeSignature(payload, 'whsec_test_secret'))
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(200, { received: true });

    const response = await request(app)
      .post('/api/billing/checkout-session')
      .set('x-tenant-id', 'carrier_duplicate_guard')
      .set('x-user-role', 'owner')
      .set('x-subscription-status', 'active')
      .send({ plan: 'professional', billingInterval: 'month' })
      .expect(409);

    expect(response.body.error).toBe('stripe_customer_already_linked');
  });

  it('requires owner or admin access for customer portal and checkout sessions', async () => {
    const app = createApp();

    const portalResponse = await request(app)
      .post('/api/billing/customer-portal')
      .set('x-tenant-id', 'carrier_billing_123')
      .set('x-user-role', 'dispatcher')
      .set('x-subscription-status', 'active')
      .send({})
      .expect(403);

    expect(portalResponse.body.error).toBe('billing_forbidden');

    const checkoutResponse = await request(app)
      .post('/api/billing/checkout-session')
      .set('x-tenant-id', 'carrier_billing_123')
      .set('x-user-role', 'dispatcher')
      .set('x-subscription-status', 'active')
      .send({ plan: 'professional', billingInterval: 'month' })
      .expect(403);

    expect(checkoutResponse.body.error).toBe('billing_forbidden');
  });

  it('validates checkout plan and interval before creating Stripe sessions', async () => {
    const app = createApp();

    const invalidPlanResponse = await request(app)
      .post('/api/billing/checkout-session')
      .set('x-tenant-id', 'carrier_billing_123')
      .set('x-user-role', 'owner')
      .set('x-subscription-status', 'active')
      .send({ plan: 'free', billingInterval: 'month' })
      .expect(400);

    expect(invalidPlanResponse.body.error).toBe('invalid_billing_plan');

    const invalidIntervalResponse = await request(app)
      .post('/api/billing/checkout-session')
      .set('x-tenant-id', 'carrier_billing_123')
      .set('x-user-role', 'owner')
      .set('x-subscription-status', 'active')
      .send({ plan: 'professional', billingInterval: 'weekly' })
      .expect(400);

    expect(invalidIntervalResponse.body.error).toBe('invalid_billing_interval');
  });

  it('returns 404 when no Stripe customer is linked to a carrier', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/billing/customer-portal')
      .set('x-tenant-id', 'carrier_without_customer')
      .set('x-user-role', 'admin')
      .set('x-subscription-status', 'active')
      .send({})
      .expect(404);

    expect(response.body.error).toBe('stripe_customer_not_found');
  });

  it('records and summarizes AI usage events with idempotency protection', async () => {
    const app = createApp();

    await request(app)
      .post('/api/ai-usage/events')
      .set('x-tenant-id', 'carrier_ai_123')
      .set('x-user-role', 'dispatcher')
      .set('x-subscription-status', 'active')
      .send({
        feature: 'dispatch-assistant',
        actionCount: 2,
        documentScans: 1,
        inputTokens: 100,
        outputTokens: 40,
        estimatedCost: 0.25,
        idempotencyKey: 'evt_ai_1',
      })
      .expect(201);

    await request(app)
      .post('/api/ai-usage/events')
      .set('x-tenant-id', 'carrier_ai_123')
      .set('x-user-role', 'dispatcher')
      .set('x-subscription-status', 'active')
      .send({
        feature: 'dispatch-assistant',
        actionCount: 2,
        documentScans: 1,
        inputTokens: 100,
        outputTokens: 40,
        estimatedCost: 0.25,
        idempotencyKey: 'evt_ai_1',
      })
      .expect(201);

    const summary = await request(app)
      .get('/api/ai-usage/summary')
      .set('x-tenant-id', 'carrier_ai_123')
      .set('x-user-role', 'owner')
      .set('x-subscription-status', 'active')
      .expect(200);

    expect(summary.body.data).toMatchObject({
      carrierId: 'carrier_ai_123',
      actionCount: 2,
      documentScans: 1,
      inputTokens: 100,
      outputTokens: 40,
      estimatedCost: 0.25,
    });
  });

  it('requires a feature for AI usage events', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/ai-usage/events')
      .set('x-tenant-id', 'carrier_ai_123')
      .set('x-user-role', 'dispatcher')
      .set('x-subscription-status', 'active')
      .send({ actionCount: 1 })
      .expect(400);

    expect(response.body.error).toBe('ai_usage_feature_required');
  });
});
