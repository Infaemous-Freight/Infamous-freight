import request from 'supertest';
import { createApp } from '../src/app';

const ownerHeaders = {
  'x-tenant-id': 'carrier_cleanup',
  'x-user-role': 'owner',
};

const dispatcherHeaders = {
  'x-tenant-id': 'carrier_cleanup',
  'x-user-role': 'dispatcher',
};

const loadPayload = {
  brokerName: 'Launch Validation Broker',
  originCity: 'Dallas',
  originState: 'TX',
  originLat: 32.7767,
  originLng: -96.797,
  destCity: 'Chicago',
  destState: 'IL',
  destLat: 41.8781,
  destLng: -87.6298,
  distance: 925,
  rate: 2600,
  ratePerMile: 2.81,
  equipmentType: 'dry_van',
  weight: 42000,
  pickupDate: '2026-05-01T10:00:00.000Z',
};

describe('validation records cleanup', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('purges load and related records for owner/admin', async () => {
    const app = createApp();

    // Create quote request
    const quote = await request(app)
      .post('/api/freight-operations/quoteRequests')
      .set(ownerHeaders)
      .send({
        brokerName: 'Launch Validation Broker',
        originCity: 'Dallas',
        destCity: 'Chicago',
        freightType: 'dry_van',
        weight: 42000,
        pickupDate: '2026-05-01T10:00:00.000Z',
        shipperRate: 2600,
        carrierCost: 2100,
        profitMargin: 500,
        status: 'pending',
      })
      .expect(201);

    const quoteId = quote.body.data.id;

    // Convert to load
    const conversion = await request(app)
      .post(`/api/workflows/quotes/${quoteId}/convert-to-load`)
      .set(ownerHeaders)
      .send({ load: loadPayload })
      .expect(201);

    const loadId = conversion.body.data.load.id;

    // Create a load assignment
    await request(app)
      .post('/api/freight-operations/loadAssignments')
      .set(ownerHeaders)
      .send({ loadId, rateConfirmed: 2500, status: 'pending' })
      .expect(201);

    // Delete the validation records
    const deleteResponse = await request(app)
      .delete(`/api/workflows/validation-records/${loadId}`)
      .set(ownerHeaders)
      .send({ quoteRequestId: quoteId })
      .expect(200);

    expect(deleteResponse.body.data.deleted).toBeGreaterThanOrEqual(3);

    // Verify the load is gone
    const loads = await request(app)
      .get('/api/loads')
      .set(ownerHeaders)
      .expect(200);

    expect(loads.body.data.find((l: { id: string }) => l.id === loadId)).toBeUndefined();

    // Verify the quote request is gone
    const quotes = await request(app)
      .get('/api/freight-operations/quoteRequests')
      .set(ownerHeaders)
      .expect(200);

    expect(quotes.body.data.find((q: { id: string }) => q.id === quoteId)).toBeUndefined();
  });

  it('returns deleted: 0 for a non-existent or cross-tenant load', async () => {
    const app = createApp();

    const response = await request(app)
      .delete('/api/workflows/validation-records/non_existent_load')
      .set(ownerHeaders)
      .expect(200);

    expect(response.body.data.deleted).toBe(0);
  });

  it('rejects cleanup requests from non-owner/admin roles', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(ownerHeaders)
      .send(loadPayload)
      .expect(201);

    const response = await request(app)
      .delete(`/api/workflows/validation-records/${load.body.data.id}`)
      .set(dispatcherHeaders)
      .expect(403);

    expect(response.body.error).toBe('billing_forbidden');
  });
});
