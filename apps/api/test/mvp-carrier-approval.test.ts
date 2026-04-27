import request from 'supertest';
import { createApp } from '../src/app';

describe('MVP carrier approval and load assignment workflow', () => {
  const tenantId = 'carrier-test-approval';
  const headers = {
    'x-tenant-id': tenantId,
    'x-user-role': 'dispatcher',
  };

  const loadPayload = {
    brokerName: 'Infamous Freight Test Broker',
    originCity: 'Dallas',
    originState: 'TX',
    originLat: 32.7767,
    originLng: -96.797,
    destCity: 'Houston',
    destState: 'TX',
    destLat: 29.7604,
    destLng: -95.3698,
    distance: 239,
    rate: 1800,
    ratePerMile: 7.53,
    equipmentType: 'Dry Van',
    weight: 38000,
    pickupDate: '2026-06-01T08:00:00.000Z',
  };

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  it('blocks load assignment when carrier is not yet approved', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);

    const response = await request(app)
      .post('/api/freight-operations/loadAssignments')
      .set(headers)
      .send({ loadId: load.body.data.id, rateConfirmed: 1700, status: 'pending' })
      .expect(422);

    expect(response.body.error).toBe('carrier_not_approved');
    expect(response.body.message).toBeDefined();
  });

  it('approves a carrier and records the approval status', async () => {
    const app = createApp();

    const response = await request(app)
      .post(`/api/carriers/${tenantId}/approve`)
      .set(headers)
      .send({})
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: tenantId,
      approvalStatus: 'APPROVED',
    });
  });

  it('allows load assignment only after carrier is approved', async () => {
    const app = createApp();

    await request(app)
      .post(`/api/carriers/${tenantId}/approve`)
      .set(headers)
      .send({})
      .expect(200);

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);

    const assignmentResponse = await request(app)
      .post('/api/freight-operations/loadAssignments')
      .set(headers)
      .send({ loadId: load.body.data.id, rateConfirmed: 1700, status: 'pending' })
      .expect(201);

    expect(assignmentResponse.body.data).toMatchObject({
      tenantId,
      loadId: load.body.data.id,
      rateConfirmed: 1700,
      status: 'pending',
    });
  });

  it('rejects a carrier and blocks subsequent load assignments', async () => {
    const app = createApp();

    await request(app)
      .post(`/api/carriers/${tenantId}/approve`)
      .set(headers)
      .send({})
      .expect(200);

    await request(app)
      .post(`/api/carriers/${tenantId}/reject`)
      .set(headers)
      .send({})
      .expect(200);

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);

    const response = await request(app)
      .post('/api/freight-operations/loadAssignments')
      .set(headers)
      .send({ loadId: load.body.data.id, rateConfirmed: 1700, status: 'pending' })
      .expect(422);

    expect(response.body.error).toBe('carrier_not_approved');
  });

  it('verifies carrier approval workflow with load assignment enforcement', async () => {
    const app = createApp();

    const docResponse = await request(app)
      .post('/api/freight-operations/loadAssignments')
      .set(headers)
      .send({ rateConfirmed: 1000, status: 'pending' })
      .expect(422);

    expect(docResponse.body.error).toBe('carrier_not_approved');

    await request(app)
      .post(`/api/carriers/${tenantId}/approve`)
      .set(headers)
      .send({})
      .expect(200);

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);

    const assignmentAfterApproval = await request(app)
      .post('/api/freight-operations/loadAssignments')
      .set(headers)
      .send({ loadId: load.body.data.id, rateConfirmed: 1700, status: 'pending' })
      .expect(201);

    expect(assignmentAfterApproval.body.data.tenantId).toBe(tenantId);
  });
});
