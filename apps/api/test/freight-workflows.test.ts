import request from 'supertest';
import { createApp } from '../src/app';

const headers = {
  'x-tenant-id': 'carrier_phase4',
  'x-user-role': 'dispatcher',
};

const loadPayload = {
  brokerName: 'Phase 4 Broker',
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

describe('freight workflow API', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('converts a quote request into a load', async () => {
    const app = createApp();

    const quote = await request(app)
      .post('/api/freight-operations/quoteRequests')
      .set(headers)
      .send({
        brokerName: 'Acme Broker',
        originCity: 'Dallas',
        destCity: 'Chicago',
        freightType: 'dry_van',
        weight: 42000,
        pickupDate: '2026-05-01T10:00:00.000Z',
        shipperRate: 2600,
        carrierCost: 2100,
        profitMargin: 500,
        status: 'approved',
      })
      .expect(201);

    const response = await request(app)
      .post(`/api/workflows/quotes/${quote.body.data.id}/convert-to-load`)
      .set(headers)
      .send({ load: loadPayload })
      .expect(201);

    expect(response.body.data.quoteRequest).toMatchObject({
      id: quote.body.data.id,
      status: 'converted',
    });
    expect(response.body.data.load).toMatchObject({
      tenantId: 'carrier_phase4',
      brokerName: 'Phase 4 Broker',
      status: 'booked',
    });
  });

  it('handles assignment, dispatch, tracking, delivery, payment, metrics, and load board lifecycle', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);
    const loadId = load.body.data.id;

    const assignment = await request(app)
      .post('/api/freight-operations/loadAssignments')
      .set(headers)
      .send({ loadId, rateConfirmed: 2500, status: 'pending' })
      .expect(201);

    const assignmentResponse = await request(app)
      .post(`/api/workflows/load-assignments/${assignment.body.data.id}/accepted`)
      .set(headers)
      .send({})
      .expect(200);

    expect(assignmentResponse.body.data.status).toBe('accepted');
    expect(assignmentResponse.body.data.acceptedAt).toBeDefined();

    const dispatch = await request(app)
      .post('/api/freight-operations/loadDispatches')
      .set(headers)
      .send({ loadId, status: 'pending', pickupContactName: 'Dock One' })
      .expect(201);

    const dispatchResponse = await request(app)
      .post(`/api/workflows/dispatches/${dispatch.body.data.id}/confirm`)
      .set(headers)
      .send({})
      .expect(200);

    expect(dispatchResponse.body.data.status).toBe('confirmed');
    expect(dispatchResponse.body.data.confirmedAt).toBeDefined();

    const trackingResponse = await request(app)
      .post(`/api/workflows/loads/${loadId}/tracking-updates`)
      .set(headers)
      .send({ latitude: 33.1, longitude: -96.9, status: 'in_transit' })
      .expect(201);

    expect(trackingResponse.body.data).toMatchObject({ loadId, status: 'in_transit' });

    const deliveryResponse = await request(app)
      .post(`/api/workflows/loads/${loadId}/verify-delivery`)
      .set(headers)
      .send({ podSignature: 'Jane Receiver', deliveryTime: '2026-05-03T10:00:00.000Z' })
      .expect(201);

    expect(deliveryResponse.body.data.deliveryConfirmation).toMatchObject({
      loadId,
      podSignature: 'Jane Receiver',
    });
    expect(deliveryResponse.body.data.tracking).toMatchObject({
      loadId,
      status: 'delivered',
      podReceived: true,
      podVerified: true,
    });

    const payment = await request(app)
      .post('/api/freight-operations/carrierPayments')
      .set(headers)
      .send({ loadId, amount: 2200, status: 'pending' })
      .expect(201);

    const paymentResponse = await request(app)
      .post(`/api/workflows/carrier-payments/${payment.body.data.id}/status`)
      .set(headers)
      .send({ status: 'paid' })
      .expect(200);

    expect(paymentResponse.body.data.status).toBe('paid');
    expect(paymentResponse.body.data.paymentDate).toBeDefined();

    const metricsResponse = await request(app)
      .post('/api/workflows/operational-metrics/rollup')
      .set(headers)
      .send({ period: 'daily', loadsBooked: 1, grossMargin: 400 })
      .expect(201);

    expect(metricsResponse.body.data).toMatchObject({
      tenantId: 'carrier_phase4',
      period: 'daily',
      loadsBooked: 1,
      grossMargin: 400,
    });

    const post = await request(app)
      .post('/api/freight-operations/loadBoardPosts')
      .set(headers)
      .send({ loadId, board: 'DAT', boardPostId: 'dat_123', status: 'posted' })
      .expect(201);

    const postResponse = await request(app)
      .post(`/api/workflows/load-board-posts/${post.body.data.id}/status`)
      .set(headers)
      .send({ status: 'expired' })
      .expect(200);

    expect(postResponse.body.data.status).toBe('expired');
  });

  it('rejects invalid assignment decisions', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/workflows/load-assignments/assignment_123/maybe')
      .set(headers)
      .send({})
      .expect(400);

    expect(response.body.error).toBe('invalid_load_assignment_decision');
  });
});
