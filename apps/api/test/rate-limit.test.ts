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

describe('rate limiting — billing endpoints', () => {
  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    delete process.env.STRIPE_SECRET_KEY;

    // Use a very low limit so tests are fast and deterministic
    originalEnv['RATE_LIMIT_BILLING_MAX'] = process.env['RATE_LIMIT_BILLING_MAX'];
    originalEnv['RATE_LIMIT_BILLING_WINDOW_SECONDS'] = process.env['RATE_LIMIT_BILLING_WINDOW_SECONDS'];
    process.env['RATE_LIMIT_BILLING_MAX'] = '3';
    process.env['RATE_LIMIT_BILLING_WINDOW_SECONDS'] = '60';
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('returns X-RateLimit-* headers on billing write requests', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/billing/checkout-session')
      .set('x-tenant-id', 'carrier-rl-headers')
      .set('x-user-role', 'owner')
      .send({ plan: 'professional', billingInterval: 'month' });

    // Regardless of outcome, rate limit headers should be present
    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
    expect(Number(res.headers['x-ratelimit-limit'])).toBe(3);
  });

  it('returns 429 after exceeding the billing rate limit', async () => {
    // Each createApp() call creates a fresh in-memory counter store
    const app = createApp();

    const makeRequest = () =>
      request(app)
        .post('/api/billing/checkout-session')
        .set('x-tenant-id', 'carrier-rl-429')
        .set('x-user-role', 'owner')
        .send({ plan: 'professional', billingInterval: 'month' });

    // The first 3 requests must not be rate-limited (they may fail for other
    // reasons — no Stripe key, etc. — but not with 429)
    for (let i = 0; i < 3; i++) {
      const res = await makeRequest();
      expect(res.status).not.toBe(429);
    }

    // The 4th request (over the limit of 3) must return 429
    const res = await makeRequest();
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('rate_limit_exceeded');
    expect(res.body.statusCode).toBe(429);
    expect(typeof res.body.retryAfter).toBe('number');
    expect(res.body.retryAfter).toBeGreaterThan(0);
    expect(res.headers['retry-after']).toBeDefined();
  });

  it('returns 429 with a consistent response shape', async () => {
    const app = createApp();

    const makeRequest = () =>
      request(app)
        .post('/api/billing/customer-portal')
        .set('x-tenant-id', 'carrier-rl-shape')
        .set('x-user-role', 'owner')
        .send({});

    for (let i = 0; i < 3; i++) {
      await makeRequest();
    }

    const res = await makeRequest();
    expect(res.status).toBe(429);
    expect(res.body).toMatchObject({
      statusCode: 429,
      error: 'rate_limit_exceeded',
      message: expect.any(String),
      retryAfter: expect.any(Number),
    });
  });

  it('applies a separate counter per client IP on billing endpoints', async () => {
    const app = createApp();

    const makeRequestFromIp = (ip: string) =>
      request(app)
        .post('/api/billing/checkout-session')
        .set('x-tenant-id', 'carrier-rl-ip')
        .set('x-user-role', 'owner')
        .set('x-forwarded-for', ip)
        .send({ plan: 'professional', billingInterval: 'month' });

    // Exhaust limit for IP A
    for (let i = 0; i < 3; i++) {
      await makeRequestFromIp('10.0.0.1');
    }
    const limitedA = await makeRequestFromIp('10.0.0.1');
    expect(limitedA.status).toBe(429);

    // IP B should still be allowed
    const allowedB = await makeRequestFromIp('10.0.0.2');
    expect(allowedB.status).not.toBe(429);
  });

  it('rate limits the Stripe webhook endpoint', async () => {
    const app = createApp();

    const payload = JSON.stringify({
      id: 'evt_rl_test',
      type: 'checkout.session.completed',
      data: { object: { customer: 'cus_rl', metadata: { carrierId: 'c1', plan: 'starter' } } },
    });
    const sig = createStripeSignature(payload, 'whsec_test_secret');

    const makeWebhookRequest = () =>
      request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', sig)
        .set('Content-Type', 'application/json')
        .send(payload);

    for (let i = 0; i < 3; i++) {
      await makeWebhookRequest();
    }

    const res = await makeWebhookRequest();
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('rate_limit_exceeded');
  });
});

describe('rate limiting — write-heavy API endpoints', () => {
  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    process.env.NODE_ENV = 'test';

    originalEnv['RATE_LIMIT_API_WRITE_MAX'] = process.env['RATE_LIMIT_API_WRITE_MAX'];
    originalEnv['RATE_LIMIT_API_WRITE_WINDOW_SECONDS'] = process.env['RATE_LIMIT_API_WRITE_WINDOW_SECONDS'];
    process.env['RATE_LIMIT_API_WRITE_MAX'] = '3';
    process.env['RATE_LIMIT_API_WRITE_WINDOW_SECONDS'] = '60';
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('returns 429 after exceeding the write limit on /api/loads', async () => {
    const app = createApp();

    const makeRequest = () =>
      request(app)
        .post('/api/loads')
        .set('x-tenant-id', 'carrier-loads-rl')
        .set('x-user-role', 'dispatcher')
        .send({ reference: 'REF-RL', origin: 'Dallas, TX', dest: 'Austin, TX' });

    for (let i = 0; i < 3; i++) {
      const res = await makeRequest();
      expect(res.status).not.toBe(429);
    }

    const res = await makeRequest();
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('rate_limit_exceeded');
  });

  it('returns 429 after exceeding the write limit on /api/shipments', async () => {
    const app = createApp();

    const makeRequest = () =>
      request(app)
        .post('/api/shipments')
        .set('x-tenant-id', 'carrier-shipments-rl')
        .set('x-user-role', 'dispatcher')
        .send({ reference: 'REF-RL-SHIP', origin: 'Houston, TX', dest: 'San Antonio, TX' });

    for (let i = 0; i < 3; i++) {
      const res = await makeRequest();
      expect(res.status).not.toBe(429);
    }

    const res = await makeRequest();
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('rate_limit_exceeded');
  });

  it('returns X-RateLimit-Remaining that decrements with each request', async () => {
    const app = createApp();

    const responses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/loads')
        .set('x-tenant-id', 'carrier-decrement-rl')
        .set('x-user-role', 'dispatcher')
        .send({ reference: `REF-${i}`, origin: 'Dallas, TX', dest: 'Austin, TX' });

      responses.push(Number(res.headers['x-ratelimit-remaining']));
    }

    // Each successive request should report a lower remaining count
    expect(responses[0]).toBeGreaterThan(responses[1]);
    expect(responses[1]).toBeGreaterThan(responses[2]);
  });

  it('does not rate limit read-only GET endpoints', async () => {
    // GET endpoints do not carry apiWriteRateLimiter, so they should never
    // return 429 even when write limits are very low
    const app = createApp();

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .get('/api/loads')
        .set('x-tenant-id', 'carrier-get-rl')
        .set('x-user-role', 'dispatcher');

      expect(res.status).not.toBe(429);
    }
  });

  it('returns 429 after exceeding the write limit on workflow endpoints', async () => {
    const app = createApp();

    const makeRequest = () =>
      request(app)
        .post('/api/freight-operations/quoteRequests')
        .set('x-tenant-id', 'carrier-workflow-rl')
        .set('x-user-role', 'dispatcher')
        .send({ description: 'test quote' });

    for (let i = 0; i < 3; i++) {
      const res = await makeRequest();
      expect(res.status).not.toBe(429);
    }

    const res = await makeRequest();
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('rate_limit_exceeded');
  });
});

describe('rate limiting — environment configuration', () => {
  it('uses RATE_LIMIT_BILLING_MAX env var when set', async () => {
    const prev = process.env['RATE_LIMIT_BILLING_MAX'];
    process.env['RATE_LIMIT_BILLING_MAX'] = '2';

    try {
      const app = createApp();

      const makeRequest = () =>
        request(app)
          .post('/api/billing/checkout-session')
          .set('x-tenant-id', 'carrier-env-rl')
          .set('x-user-role', 'owner')
          .send({ plan: 'professional', billingInterval: 'month' });

      const first = await makeRequest();
      expect(Number(first.headers['x-ratelimit-limit'])).toBe(2);
      expect(first.status).not.toBe(429);

      await makeRequest(); // request 2 — at the limit

      const third = await makeRequest();
      expect(third.status).toBe(429);
    } finally {
      if (prev === undefined) {
        delete process.env['RATE_LIMIT_BILLING_MAX'];
      } else {
        process.env['RATE_LIMIT_BILLING_MAX'] = prev;
      }
    }
  });

  it('uses RATE_LIMIT_API_WRITE_MAX env var when set', async () => {
    const prev = process.env['RATE_LIMIT_API_WRITE_MAX'];
    process.env['RATE_LIMIT_API_WRITE_MAX'] = '1';

    try {
      const app = createApp();

      const makeRequest = () =>
        request(app)
          .post('/api/loads')
          .set('x-tenant-id', 'carrier-api-env-rl')
          .set('x-user-role', 'dispatcher')
          .send({ reference: 'REF-ENV', origin: 'Dallas, TX', dest: 'Austin, TX' });

      const first = await makeRequest();
      expect(Number(first.headers['x-ratelimit-limit'])).toBe(1);
      expect(first.status).not.toBe(429);

      const second = await makeRequest();
      expect(second.status).toBe(429);
    } finally {
      if (prev === undefined) {
        delete process.env['RATE_LIMIT_API_WRITE_MAX'];
      } else {
        process.env['RATE_LIMIT_API_WRITE_MAX'] = prev;
      }
    }
  });
});
