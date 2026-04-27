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

    const response = await request(app)
      .post('/api/billing/customer-portal')
      .set('x-tenant-id', 'carrier_billing_123')
      .set('x-user-role', 'owner')
      .send({})
      .expect(500);

    expect(response.body.error).toBe('stripe_secret_key_required');
  });

  it('requires owner or admin access for customer portal sessions', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/billing/customer-portal')
      .set('x-tenant-id', 'carrier_billing_123')
      .set('x-user-role', 'dispatcher')
      .send({})
      .expect(403);

    expect(response.body.error).toBe('billing_forbidden');
  });

  it('returns 404 when no Stripe customer is linked to a carrier', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/billing/customer-portal')
      .set('x-tenant-id', 'carrier_without_customer')
      .set('x-user-role', 'admin')
      .send({})
      .expect(404);

    expect(response.body.error).toBe('stripe_customer_not_found');
  });
});
