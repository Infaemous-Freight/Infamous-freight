import request from 'supertest';
import { createApp } from '../src/app';
import { resetRateLimitBucketsForTests } from '../src/rate-limit';

const authHeaders = {
  'x-tenant-id': 'tenant-recovery',
  'x-user-role': 'dispatcher',
  'x-subscription-status': 'active',
};

afterEach(() => {
  resetRateLimitBucketsForTests();
  delete process.env.RATE_LIMIT_ENABLED;
  delete process.env.AUTH_MODE;
});

describe('production recovery API fallbacks', () => {
  it('returns safe empty responses for public load-board and quote intake endpoints', async () => {
    const app = createApp();

    const loads = await request(app).get('/api/loads/search');
    expect(loads.status).toBe(200);
    expect(loads.body.loads).toEqual([]);
    expect(loads.body.meta.source).toBe('safe_empty_fallback');

    const quote = await request(app)
      .post('/api/public/quote-requests')
      .send({ company: 'Recovery Shipper', email: 'ops@example.com' });
    expect(quote.status).toBe(202);
    expect(quote.body.quote.trackingNumber).toBe('PENDING');
    expect(quote.body.meta.persisted).toBe(false);
  });

  it('does not shadow implemented tenant list endpoints', async () => {
    const app = createApp();

    const loads = await request(app).get('/api/loads').set(authHeaders);
    const drivers = await request(app).get('/api/drivers').set(authHeaders);
    const shipments = await request(app).get('/api/shipments').set(authHeaders);

    expect(loads.status).toBe(200);
    expect(drivers.status).toBe(200);
    expect(shipments.status).toBe(200);
    expect(loads.body.meta).toBeUndefined();
    expect(drivers.body.meta).toBeUndefined();
    expect(shipments.body.meta).toBeUndefined();
  });

  it.each([
    ['/api/dispatch/board', 'get'],
    ['/api/dispatch/backhauls/driver-1', 'get'],
    ['/api/loads/load-1', 'get'],
    ['/api/drivers/driver-1', 'get'],
    ['/api/eld/drivers/driver-1/hos', 'get'],
    ['/api/rate-analytics/trend', 'get'],
    ['/api/broker-credit/123456', 'get'],
    ['/api/compliance/dashboard/default', 'get'],
    ['/api/compliance/alerts/default', 'get'],
    ['/api/csa/carrier/1234567', 'get'],
    ['/api/chat/threads', 'get'],
    ['/api/chat/threads/thread-1/messages', 'get'],
    ['/api/payroll/settlements/driver-1', 'get'],
    ['/api/payroll/earnings/driver-1', 'get'],
    ['/api/notifications', 'get'],
    ['/api/mobile/profile', 'get'],
    ['/api/mobile/current-load', 'get'],
    ['/api/mobile/earnings', 'get'],
    ['/api/mobile/load-history', 'get'],
  ])('does not 404 for authenticated GET %s', async (path, method) => {
    const app = createApp();
    const response = await request(app)[method as 'get'](path).set(authHeaders);

    expect(response.status).toBe(200);
    expect(response.body.meta.source).toBe('safe_empty_fallback');
  });

  it.each([
    ['/api/dispatch/auto', { loadId: 'load-1' }],
    ['/api/loads/book', { loadId: 'load-1' }],
    ['/api/rate-analytics/compare', { brokerOffer: 2500 }],
    ['/api/factoring/compare', { amount: 2500 }],
    ['/api/ratecons/generate', { loadId: 'load-1' }],
    ['/api/uploads', { loadId: 'load-1' }],
    ['/api/mobile/status', { status: 'on_duty' }],
  ])('does not 404 for authenticated POST %s', async (path, body) => {
    const app = createApp();
    const response = await request(app).post(path).set(authHeaders).send(body);

    expect([200, 202]).toContain(response.status);
    expect(response.body.meta.source).toBe('safe_empty_fallback');
  });
});
