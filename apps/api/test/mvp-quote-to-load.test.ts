import request from 'supertest';
import { createApp } from '../src/app';
import { authHeaders, TEST_JWT_SECRET } from './helpers';

describe('MVP quote-to-load workflow', () => {
  const tenantId = 'carrier-test-quote-to-load';

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  });

  it('creates an approved quote request and converts it into a load', async () => {
    const app = createApp();

    const quoteResponse = await request(app)
      .post('/api/freight-operations/quoteRequests')
      .set(authHeaders(tenantId, 'dispatcher'))
      .send({
        brokerName: 'Infamous Freight Test Shipper',
        originCity: 'Dallas',
        destCity: 'Atlanta',
        freightType: 'Dry Van',
        weight: 42000,
        pickupDate: '2026-05-01T10:00:00.000Z',
        deliveryDeadline: '2026-05-03T17:00:00.000Z',
        shipperRate: 2800,
        carrierCost: 2250,
        profitMargin: 550,
        status: 'approved',
      })
      .expect(201);

    expect(quoteResponse.body.data).toMatchObject({
      tenantId,
      brokerName: 'Infamous Freight Test Shipper',
      originCity: 'Dallas',
      destCity: 'Atlanta',
      status: 'approved',
    });

    const quoteId = quoteResponse.body.data.id;

    const conversionResponse = await request(app)
      .post(`/api/workflows/quotes/${quoteId}/convert-to-load`)
      .set(authHeaders(tenantId, 'dispatcher'))
      .send({
        quoteStatus: 'converted',
        load: {
          brokerName: 'Infamous Freight Test Shipper',
          originCity: 'Dallas',
          originState: 'TX',
          originLat: 32.7767,
          originLng: -96.797,
          destCity: 'Atlanta',
          destState: 'GA',
          destLat: 33.749,
          destLng: -84.388,
          distance: 781,
          rate: 2800,
          ratePerMile: 3.59,
          equipmentType: 'Dry Van',
          weight: 42000,
          pickupDate: '2026-05-01T10:00:00.000Z',
          status: 'booked',
        },
      })
      .expect(201);

    expect(conversionResponse.body.data.quoteRequest).toMatchObject({
      id: quoteId,
      tenantId,
      status: 'converted',
    });

    expect(conversionResponse.body.data.load).toMatchObject({
      tenantId,
      quoteRequestId: quoteId,
      brokerName: 'Infamous Freight Test Shipper',
      originCity: 'Dallas',
      destCity: 'Atlanta',
      status: 'booked',
    });
  });
});
