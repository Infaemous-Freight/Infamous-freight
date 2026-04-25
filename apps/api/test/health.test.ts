import request from 'supertest';
import { createApp } from '../src/app';

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

describe('tenant-protected resource routes', () => {
  it('rejects /api/loads without tenant id', async () => {
    const response = await request(createApp())
      .get('/api/loads')
      .set('x-user-role', 'dispatcher');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('tenant_id_required');
  });

  it('rejects /api/loads without valid role', async () => {
    const response = await request(createApp())
      .get('/api/loads')
      .set('x-tenant-id', 'tenant-1');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('forbidden');
  });

  it('creates and lists records only for same tenant', async () => {
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
      .set('x-tenant-id', 'tenant-1')
      .set('x-user-role', 'dispatcher')
      .send(shipmentForTenant1);

    expect(createForT1.status).toBe(201);
    expect(createForT1.body.data.tenantId).toBe('tenant-1');

    const createForT2 = await request(app)
      .post('/api/shipments')
      .set('x-tenant-id', 'tenant-2')
      .set('x-user-role', 'dispatcher')
      .send(shipmentForTenant2);

    expect(createForT2.status).toBe(201);
    expect(createForT2.body.data.tenantId).toBe('tenant-2');
    const listT1 = await request(app)
      .get('/api/shipments')
      .set('x-tenant-id', 'tenant-1')
      .set('x-user-role', 'dispatcher');

    expect(listT1.status).toBe(200);
    expect(listT1.body.count).toBe(1);
    expect(listT1.body.data[0].reference).toBe('REF-1');
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
