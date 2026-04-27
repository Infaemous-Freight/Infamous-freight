import request from 'supertest';
import { createApp } from '../src/app';
import { authHeaders, TEST_JWT_SECRET } from './helpers';

describe('freight operations API', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  });

  it('creates, lists, and updates quote requests for a tenant', async () => {
    const app = createApp();

    const createResponse = await request(app)
      .post('/api/freight-operations/quoteRequests')
      .set(authHeaders('carrier_123', 'dispatcher'))
      .send({
        brokerName: 'Acme Broker',
        originCity: 'Dallas',
        destCity: 'Chicago',
        freightType: 'dry_van',
        weight: 42000,
        pickupDate: '2026-05-01T10:00:00.000Z',
        deliveryDeadline: '2026-05-03T10:00:00.000Z',
        shipperRate: 2600,
        carrierCost: 2100,
        profitMargin: 500,
        status: 'pending',
      })
      .expect(201);

    expect(createResponse.body.data).toMatchObject({
      tenantId: 'carrier_123',
      brokerName: 'Acme Broker',
      status: 'pending',
    });

    const listResponse = await request(app)
      .get('/api/freight-operations/quoteRequests')
      .set(authHeaders('carrier_123', 'dispatcher'))
      .expect(200);

    expect(listResponse.body.count).toBe(1);
    expect(listResponse.body.data[0].id).toBe(createResponse.body.data.id);

    const updateResponse = await request(app)
      .patch(`/api/freight-operations/quoteRequests/${createResponse.body.data.id}`)
      .set(authHeaders('carrier_123', 'dispatcher'))
      .send({ status: 'accepted' })
      .expect(200);

    expect(updateResponse.body.data).toMatchObject({
      id: createResponse.body.data.id,
      tenantId: 'carrier_123',
      status: 'accepted',
    });
  });

  it('keeps freight operation records isolated by tenant', async () => {
    const app = createApp();

    await request(app)
      .post('/api/freight-operations/carrierPayments')
      .set(authHeaders('carrier_123', 'dispatcher'))
      .send({
        loadId: 'load_123',
        amount: 1200,
        paymentMethod: 'ach',
        status: 'pending',
      })
      .expect(201);

    const otherTenantResponse = await request(app)
      .get('/api/freight-operations/carrierPayments')
      .set(authHeaders('carrier_999', 'dispatcher'))
      .expect(200);

    expect(otherTenantResponse.body.count).toBe(0);
    expect(otherTenantResponse.body.data).toEqual([]);
  });

  it('rejects unsupported freight operation resources', async () => {
    const app = createApp();

    const response = await request(app)
      .get('/api/freight-operations/notAResource')
      .set(authHeaders('carrier_123', 'dispatcher'))
      .expect(404);

    expect(response.body).toMatchObject({
      error: 'freight_operation_resource_not_found',
    });
  });

  it('requires a valid Bearer token', async () => {
    const app = createApp();

    await request(app)
      .get('/api/freight-operations/quoteRequests')
      .expect(401);
  });
});
