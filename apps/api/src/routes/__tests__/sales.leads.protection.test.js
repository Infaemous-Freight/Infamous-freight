const request = require('supertest');
const express = require('express');

const {
  createSalesLeadProtection,
  parseCsvSet,
  parsePositiveInt,
} = require('../../middleware/salesLeadProtection');

describe('Sales lead anti-abuse protection', () => {
  const buildApp = (opts = {}) => {
    const app = express();
    app.use(express.json());
    app.post('/api/sales/leads', createSalesLeadProtection(opts), (_req, res) => {
      res.status(201).json({ success: true });
    });

    return app;
  };

  test('rejects lead requests when secret header is missing', async () => {
    const app = buildApp({ sharedSecret: 'abc123' });

    const res = await request(app)
      .post('/api/sales/leads')
      .send({ name: 'A', email: 'a@example.com', type: 'SHIPPER' });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid sales lead secret header');
  });

  test('accepts lead request when configured secret header is valid', async () => {
    const app = buildApp({
      sharedSecret: 'abc123',
      secretHeaderName: 'x-custom-sales-secret',
    });

    const res = await request(app)
      .post('/api/sales/leads')
      .set('x-custom-sales-secret', 'abc123')
      .send({ name: 'A', email: 'a@example.com', type: 'SHIPPER' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('rejects requests from non-allowlisted origins', async () => {
    const app = buildApp({ allowedOrigins: parseCsvSet('https://good.example.com') });

    const res = await request(app)
      .post('/api/sales/leads')
      .set('Origin', 'https://evil.example.com')
      .send({ name: 'A', email: 'a@example.com', type: 'SHIPPER' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Origin not allowed');
  });

  test('allows requests from allowlisted origins', async () => {
    const app = buildApp({
      allowedOrigins: parseCsvSet('https://good.example.com, https://other.example.com'),
    });

    const res = await request(app)
      .post('/api/sales/leads')
      .set('Origin', 'https://other.example.com')
      .send({ name: 'A', email: 'a@example.com', type: 'SHIPPER' });

    expect(res.status).toBe(201);
  });

  test('throttles requests per IP and allows different IPs', async () => {
    const app = buildApp({ maxPerIp: 2, windowMs: 60_000 });

    const first = await request(app)
      .post('/api/sales/leads')
      .set('X-Forwarded-For', '203.0.113.10')
      .send({ name: 'A', email: 'a@example.com', type: 'SHIPPER' });

    const second = await request(app)
      .post('/api/sales/leads')
      .set('X-Forwarded-For', '203.0.113.10')
      .send({ name: 'A', email: 'a@example.com', type: 'SHIPPER' });

    const throttled = await request(app)
      .post('/api/sales/leads')
      .set('X-Forwarded-For', '203.0.113.10')
      .send({ name: 'A', email: 'a@example.com', type: 'SHIPPER' });

    const differentIp = await request(app)
      .post('/api/sales/leads')
      .set('X-Forwarded-For', '203.0.113.11')
      .send({ name: 'A', email: 'a@example.com', type: 'SHIPPER' });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(throttled.status).toBe(429);
    expect(differentIp.status).toBe(201);
  });

  test('parse helpers handle env-var edge cases', () => {
    expect(parseCsvSet(' , https://a.com, ,https://b.com ').size).toBe(2);
    expect(parseCsvSet('').size).toBe(0);

    expect(parsePositiveInt('10', 5)).toBe(10);
    expect(parsePositiveInt('0', 5)).toBe(5);
    expect(parsePositiveInt('-1', 5)).toBe(5);
    expect(parsePositiveInt('not-a-number', 5)).toBe(5);
  });
});
