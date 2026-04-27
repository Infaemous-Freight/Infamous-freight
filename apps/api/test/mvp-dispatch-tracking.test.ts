import request from 'supertest';
import { createApp } from '../src/app';

const headers = {
  'x-tenant-id': 'carrier-dispatch-tracking-test',
  'x-user-role': 'dispatcher',
};

const loadPayload = {
  brokerName: 'Dispatch Test Broker',
  originCity: 'Chicago',
  originState: 'IL',
  originLat: 41.8781,
  originLng: -87.6298,
  destCity: 'Dallas',
  destState: 'TX',
  destLat: 32.7767,
  destLng: -96.797,
  distance: 925,
  rate: 2800,
  ratePerMile: 3.03,
  equipmentType: 'Dry Van',
  weight: 42000,
  pickupDate: '2026-06-01T08:00:00.000Z',
  status: 'pending',
};

describe('MVP dispatch board and shipment tracking', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  it('progresses a load through MVP dispatch stages', async () => {
    const app = createApp();

    const loadRes = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);

    const loadId = loadRes.body.data.id;

    expect(loadRes.body.data).toMatchObject({
      tenantId: 'carrier-dispatch-tracking-test',
      status: 'pending',
    });

    const dispatchedRes = await request(app)
      .post(`/api/loads/${loadId}/status`)
      .set(headers)
      .send({ status: 'dispatched' })
      .expect(200);

    expect(dispatchedRes.body.data).toMatchObject({ id: loadId, status: 'dispatched' });

    const atPickupRes = await request(app)
      .post(`/api/loads/${loadId}/status`)
      .set(headers)
      .send({ status: 'at_pickup' })
      .expect(200);

    expect(atPickupRes.body.data).toMatchObject({ id: loadId, status: 'at_pickup' });

    const inTransitRes = await request(app)
      .post(`/api/loads/${loadId}/status`)
      .set(headers)
      .send({ status: 'in_transit' })
      .expect(200);

    expect(inTransitRes.body.data).toMatchObject({ id: loadId, status: 'in_transit' });

    const atDeliveryRes = await request(app)
      .post(`/api/loads/${loadId}/status`)
      .set(headers)
      .send({ status: 'at_delivery' })
      .expect(200);

    expect(atDeliveryRes.body.data).toMatchObject({ id: loadId, status: 'at_delivery' });

    const deliveredRes = await request(app)
      .post(`/api/loads/${loadId}/status`)
      .set(headers)
      .send({ status: 'delivered' })
      .expect(200);

    expect(deliveredRes.body.data).toMatchObject({ id: loadId, status: 'delivered' });
  });

  it('rejects an invalid load status', async () => {
    const app = createApp();

    const loadRes = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);

    const loadId = loadRes.body.data.id;

    const res = await request(app)
      .post(`/api/loads/${loadId}/status`)
      .set(headers)
      .send({ status: 'flying' })
      .expect(400);

    expect(res.body.error).toBe('invalid_load_status');
  });

  it('returns 404 when updating status of a load that does not belong to the tenant', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/loads/nonexistent-load-id/status')
      .set(headers)
      .send({ status: 'dispatched' })
      .expect(404);

    expect(res.body.error).toBe('load_not_found_for_tenant');
  });

  it('attaches tracking updates to a load and separates customer-visible from internal', async () => {
    const app = createApp();

    const loadRes = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);

    const loadId = loadRes.body.data.id;

    await request(app)
      .post(`/api/loads/${loadId}/status`)
      .set(headers)
      .send({ status: 'in_transit' })
      .expect(200);

    await request(app)
      .post(`/api/workflows/loads/${loadId}/tracking-updates`)
      .set(headers)
      .send({
        status: 'in_transit',
        latitude: 39.1,
        longitude: -92.3,
        visibilityLevel: 'customer',
        notes: null,
      })
      .expect(201);

    await request(app)
      .post(`/api/workflows/loads/${loadId}/tracking-updates`)
      .set(headers)
      .send({
        status: 'in_transit',
        latitude: 36.2,
        longitude: -94.5,
        visibilityLevel: 'internal',
        notes: 'Driver called — requested 30-min break at truck stop.',
      })
      .expect(201);

    const dispatcherRes = await request(app)
      .get(`/api/loads/${loadId}/tracking-updates`)
      .set(headers)
      .expect(200);

    expect(dispatcherRes.body.count).toBe(2);
    expect(dispatcherRes.body.data.some((r: Record<string, unknown>) => r.visibilityLevel === 'internal')).toBe(true);
    expect(dispatcherRes.body.data.some((r: Record<string, unknown>) => r.visibilityLevel === 'customer')).toBe(true);

    const customerRes = await request(app)
      .get(`/api/tracking/${loadId}`)
      .expect(200);

    expect(customerRes.body.count).toBe(1);
    const customerUpdate = customerRes.body.data[0];

    expect(customerUpdate.visibilityLevel).toBeUndefined();
    expect(customerUpdate.notes).toBeUndefined();
    expect(customerUpdate.tenantId).toBeUndefined();
    expect(customerUpdate.status).toBe('in_transit');
    expect(customerUpdate.latitude).toBe(39.1);
  });

  it('customer tracking endpoint excludes internal-only updates completely', async () => {
    const app = createApp();

    const loadRes = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);

    const loadId = loadRes.body.data.id;

    await request(app)
      .post(`/api/workflows/loads/${loadId}/tracking-updates`)
      .set(headers)
      .send({
        status: 'at_pickup',
        visibilityLevel: 'internal',
        notes: 'Carrier confirmed dock door 12.',
      })
      .expect(201);

    const customerRes = await request(app)
      .get(`/api/tracking/${loadId}`)
      .expect(200);

    expect(customerRes.body.count).toBe(0);
    expect(customerRes.body.data).toEqual([]);
  });
});
