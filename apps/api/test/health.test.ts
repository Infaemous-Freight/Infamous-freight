import request from 'supertest';
import { createApp } from '../src/app';
import { resetEventStore } from '../src/event-store';

function authHeaders(role: string, tenantId = 'tenant_123') {
  return {
    authorization: 'Bearer test-token',
    'x-user-id': 'user_123',
    'x-tenant-id': tenantId,
    'x-role': role,
  };
}

describe('health and readiness endpoints', () => {
  it('returns 200 and ok status for health', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('returns 200 and ready status for readiness', async () => {
    const response = await request(createApp()).get('/ready');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });
});

describe('auth and RBAC guards', () => {
  it('rejects missing auth headers', async () => {
    const response = await request(createApp()).get('/api/session');

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/authorization/i);
  });

  it('returns session context when required headers are present', async () => {
    const response = await request(createApp())
      .get('/api/session')
      .set(authHeaders('dispatcher'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      userId: 'user_123',
      tenantId: 'tenant_123',
      role: 'dispatcher',
    });
  });

  it('blocks non-admin roles from admin route', async () => {
    const response = await request(createApp())
      .get('/api/admin/ping')
      .set(authHeaders('driver'));

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  it('allows owner role on admin route', async () => {
    const response = await request(createApp())
      .get('/api/admin/ping')
      .set(authHeaders('owner'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      tenantId: 'tenant_123',
    });
  });
});

describe('AI decision and billing controls', () => {
  beforeEach(() => {
    resetEventStore();
  });

  it('logs AI decisions and scopes retrieval by tenant', async () => {
    const app = createApp();

    const created = await request(app)
      .post('/api/ai/decisions')
      .set(authHeaders('dispatcher', 'tenant_a'))
      .send({
        decisionType: 'load_assignment',
        model: 'gpt-5.3-codex',
        input: { loadId: 'load_1' },
        output: { driverId: 'driver_1' },
      });

    expect(created.status).toBe(201);
    expect(created.body.tenantId).toBe('tenant_a');

    const sameTenant = await request(app)
      .get('/api/ai/decisions')
      .set(authHeaders('dispatcher', 'tenant_a'));

    expect(sameTenant.status).toBe(200);
    expect(sameTenant.body).toHaveLength(1);
    expect(sameTenant.body[0].tenantId).toBe('tenant_a');

    const otherTenant = await request(app)
      .get('/api/ai/decisions')
      .set(authHeaders('dispatcher', 'tenant_b'));

    expect(otherTenant.status).toBe(200);
    expect(otherTenant.body).toEqual([]);
  });

  it('enforces billing idempotency per tenant and key', async () => {
    const app = createApp();

    const first = await request(app)
      .post('/api/billing/events')
      .set(authHeaders('owner', 'tenant_bill'))
      .send({
        idempotencyKey: 'evt_1',
        eventType: 'invoice_paid',
        payload: { invoiceId: 'inv_1' },
      });

    expect(first.status).toBe(200);
    expect(first.body.deduplicated).toBe(false);

    const second = await request(app)
      .post('/api/billing/events')
      .set(authHeaders('owner', 'tenant_bill'))
      .send({
        idempotencyKey: 'evt_1',
        eventType: 'invoice_paid',
        payload: { invoiceId: 'inv_1' },
      });

    expect(second.status).toBe(200);
    expect(second.body.deduplicated).toBe(true);
    expect(second.body.event.id).toBe(first.body.event.id);

    const crossTenant = await request(app)
      .post('/api/billing/events')
      .set(authHeaders('owner', 'tenant_other'))
      .send({
        idempotencyKey: 'evt_1',
        eventType: 'invoice_paid',
        payload: { invoiceId: 'inv_1' },
      });

    expect(crossTenant.status).toBe(200);
    expect(crossTenant.body.deduplicated).toBe(false);
    expect(crossTenant.body.event.id).not.toBe(first.body.event.id);
  });
});
