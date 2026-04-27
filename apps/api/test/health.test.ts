import request from 'supertest';
import { createApp } from '../src/app';
import { authHeaders, makeToken, TEST_JWT_SECRET } from './helpers';
import jwt from 'jsonwebtoken';

describe('health endpoint', () => {
  it('returns 200 and ok status on /health', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.timestamp).toBe('string');
    expect(response.body.services.database).toBe('connected');
  });

  it('returns 200 and ok status on /api/health', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.timestamp).toBe('string');
  });
});

describe('authentication middleware', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  });

  it('rejects /api/loads without a Bearer token', async () => {
    const response = await request(createApp()).get('/api/loads');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('unauthorized');
  });

  it('rejects /api/loads with an invalid token', async () => {
    const response = await request(createApp())
      .get('/api/loads')
      .set('Authorization', 'Bearer not.a.valid.jwt');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('unauthorized');
  });

  it('rejects a token signed with the wrong secret', async () => {
    const badToken = jwt.sign({ sub: 'user-1', tenantId: 'tenant-1', role: 'dispatcher' }, 'wrong-secret');
    const response = await request(createApp())
      .get('/api/loads')
      .set('Authorization', `Bearer ${badToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('unauthorized');
  });

  it('rejects a token that is missing tenantId', async () => {
    const token = jwt.sign({ sub: 'user-1', role: 'dispatcher' }, TEST_JWT_SECRET);
    const response = await request(createApp())
      .get('/api/loads')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('forbidden');
  });

  it('rejects a token with an invalid role', async () => {
    const token = jwt.sign({ sub: 'user-1', tenantId: 'tenant-1', role: 'hacker' }, TEST_JWT_SECRET);
    const response = await request(createApp())
      .get('/api/loads')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('forbidden');
  });

  it('accepts a valid Bearer token and returns data', async () => {
    const response = await request(createApp())
      .get('/api/loads')
      .set(authHeaders('tenant-1', 'dispatcher'));

    expect(response.status).toBe(200);
  });
});

describe('tenant isolation', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  });

  it('creates and lists records only for the authenticated tenant', async () => {
    const app = createApp();
    const shipmentForTenant1 = {
      reference: 'REF-1',
      brokerName: 'Broker One',
      origin: 'Dallas, TX',
      dest: 'Austin, TX',
      pickupDate: '2024-01-10',
      deliveryDate: '2024-01-11',
    };
    const shipmentForTenant2 = {
      reference: 'REF-2',
      brokerName: 'Broker Two',
      origin: 'Houston, TX',
      dest: 'San Antonio, TX',
      pickupDate: '2024-01-12',
      deliveryDate: '2024-01-13',
    };

    const createForT1 = await request(app)
      .post('/api/shipments')
      .set(authHeaders('tenant-1', 'dispatcher'))
      .send(shipmentForTenant1);

    expect(createForT1.status).toBe(201);
    expect(createForT1.body.data.tenantId).toBe('tenant-1');

    const createForT2 = await request(app)
      .post('/api/shipments')
      .set(authHeaders('tenant-2', 'dispatcher'))
      .send(shipmentForTenant2);

    expect(createForT2.status).toBe(201);
    expect(createForT2.body.data.tenantId).toBe('tenant-2');

    const listT1 = await request(app)
      .get('/api/shipments')
      .set(authHeaders('tenant-1', 'dispatcher'));

    expect(listT1.status).toBe(200);
    expect(listT1.body.count).toBe(1);
    expect(listT1.body.data[0].reference).toBe('REF-1');
  });

  it('blocks cross-tenant access: tenant-2 cannot see tenant-1 data', async () => {
    const app = createApp();

    await request(app)
      .post('/api/shipments')
      .set(authHeaders('tenant-cross-1', 'dispatcher'))
      .send({
        reference: 'CROSS-1',
        brokerName: 'Broker Cross',
        origin: 'Dallas, TX',
        dest: 'Austin, TX',
        pickupDate: '2024-01-10',
        deliveryDate: '2024-01-11',
      })
      .expect(201);

    // Tenant-2 tries to access tenant-1's data using its own valid token
    const crossTenantList = await request(app)
      .get('/api/shipments')
      .set(authHeaders('tenant-cross-2', 'dispatcher'));

    expect(crossTenantList.status).toBe(200);
    expect(crossTenantList.body.count).toBe(0);
    expect(crossTenantList.body.data).toEqual([]);
  });

  it('blocks role escalation: a dispatcher token cannot access billing admin endpoints', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/billing/customer-portal')
      .set(authHeaders('tenant-esc', 'dispatcher'))
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('billing_forbidden');
  });

  it('blocks role escalation: x-user-role header is ignored — only the JWT role is used', async () => {
    const app = createApp();

    // Attacker provides a dispatcher JWT but tries to override with an owner role header
    const dispatcherToken = makeToken('tenant-esc', 'dispatcher');
    const response = await request(app)
      .post('/api/billing/customer-portal')
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .set('x-user-role', 'owner')
      .send({});

    // Should still be forbidden because the JWT says dispatcher
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('billing_forbidden');
  });
});

describe('configuration safety', () => {
  it('fails fast without DATABASE_URL outside test mode', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousDatabaseUrl = process.env.DATABASE_URL;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;

      expect(() => createApp()).toThrow('DATABASE_URL is required outside of test mode.');
    } finally {
      process.env.NODE_ENV = previousNodeEnv;

      if (previousDatabaseUrl !== undefined) {
        process.env.DATABASE_URL = previousDatabaseUrl;
      } else {
        delete process.env.DATABASE_URL;
      }
    }
  });
});
