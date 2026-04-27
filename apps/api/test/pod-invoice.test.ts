import request from 'supertest';
import { createApp } from '../src/app';

const headers = {
  'x-tenant-id': 'carrier-test-pod-invoice',
  'x-user-role': 'dispatcher',
};

const loadPayload = {
  brokerName: 'POD Invoice Broker',
  originCity: 'Dallas',
  originState: 'TX',
  originLat: 32.7767,
  originLng: -96.797,
  destCity: 'Chicago',
  destState: 'IL',
  destLat: 41.8781,
  destLng: -87.6298,
  distance: 925,
  rate: 2800,
  ratePerMile: 3.03,
  equipmentType: 'dry_van',
  weight: 42000,
  pickupDate: '2026-05-01T10:00:00.000Z',
};

describe('POD upload and invoice generation workflow', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('rejects closing a load that has no POD', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);

    const response = await request(app)
      .post(`/api/workflows/loads/${load.body.data.id}/close`)
      .set(headers)
      .send({})
      .expect(422);

    expect(response.body.error).toBe('pod_required_to_close_load');
  });

  it('rejects creating an invoice without a POD', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);

    const response = await request(app)
      .post(`/api/workflows/loads/${load.body.data.id}/invoices`)
      .set(headers)
      .send({ shipperRate: 2800, carrierRate: 2200 })
      .expect(422);

    expect(response.body.error).toBe('pod_required_to_create_invoice');
  });

  it('uploads a POD and attaches it to a load', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);
    const loadId = load.body.data.id;

    const pod = await request(app)
      .post(`/api/workflows/loads/${loadId}/upload-pod`)
      .set(headers)
      .send({
        podSignature: 'Jane Receiver',
        deliveryTime: '2026-05-03T14:00:00.000Z',
      })
      .expect(201);

    expect(pod.body.data.loadId).toBe(loadId);
    expect(pod.body.data.podSignature).toBe('Jane Receiver');
  });

  it('closes a load after POD is uploaded', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);
    const loadId = load.body.data.id;

    await request(app)
      .post(`/api/workflows/loads/${loadId}/upload-pod`)
      .set(headers)
      .send({ podSignature: 'Bob Receiver', deliveryTime: '2026-05-03T14:00:00.000Z' })
      .expect(201);

    const closeResponse = await request(app)
      .post(`/api/workflows/loads/${loadId}/close`)
      .set(headers)
      .send({})
      .expect(200);

    expect(closeResponse.body.data.status).toBe('closed');
    expect(closeResponse.body.data.id).toBe(loadId);
  });

  it('calculates gross margin correctly when creating an invoice after POD', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);
    const loadId = load.body.data.id;

    await request(app)
      .post(`/api/workflows/loads/${loadId}/upload-pod`)
      .set(headers)
      .send({ podSignature: 'Alice Receiver', deliveryTime: '2026-05-03T16:00:00.000Z' })
      .expect(201);

    const invoiceResponse = await request(app)
      .post(`/api/workflows/loads/${loadId}/invoices`)
      .set(headers)
      .send({
        shipperRate: 2800,
        carrierRate: 2200,
        brokerName: 'POD Invoice Broker',
        brokerEmail: 'billing@broker.com',
      })
      .expect(201);

    const invoice = invoiceResponse.body.data;
    expect(invoice.loadId).toBe(loadId);
    expect(invoice.shipperRate).toBe(2800);
    expect(invoice.carrierRate).toBe(2200);
    expect(invoice.grossMargin).toBe(600);
    expect(invoice.grossMarginPercentage).toBeCloseTo(21.43, 1);
    expect(invoice.podAttached).toBe(true);
    expect(invoice.status).toBe('draft');
    expect(invoice.invoiceNumber).toMatch(/^INF-/);
  });

  it('sends an invoice with POD attached', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);
    const loadId = load.body.data.id;

    await request(app)
      .post(`/api/workflows/loads/${loadId}/upload-pod`)
      .set(headers)
      .send({ podSignature: 'Charlie Receiver', deliveryTime: '2026-05-03T15:00:00.000Z' })
      .expect(201);

    const invoiceResponse = await request(app)
      .post(`/api/workflows/loads/${loadId}/invoices`)
      .set(headers)
      .send({ shipperRate: 3000, carrierRate: 2400 })
      .expect(201);

    const sendResponse = await request(app)
      .post(`/api/workflows/invoices/${invoiceResponse.body.data.id}/send`)
      .set(headers)
      .send({})
      .expect(200);

    expect(sendResponse.body.data.status).toBe('sent');
    expect(sendResponse.body.data.podAttached).toBe(true);
  });

  it('records the full POD-to-invoice flow as compliance evidence', async () => {
    const app = createApp();

    // 1. Create a load
    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);
    const loadId = load.body.data.id;

    // 2. Upload POD
    const pod = await request(app)
      .post(`/api/workflows/loads/${loadId}/upload-pod`)
      .set(headers)
      .send({
        podSignature: 'Delivery Manager',
        deliveryTime: '2026-05-03T12:00:00.000Z',
      })
      .expect(201);

    expect(pod.body.data.loadId).toBe(loadId);

    // 3. Create invoice with gross margin calculation
    const invoice = await request(app)
      .post(`/api/workflows/loads/${loadId}/invoices`)
      .set(headers)
      .send({
        shipperRate: 2800,
        carrierRate: 2250,
        brokerName: 'Infamous Freight Test Broker',
        brokerEmail: 'billing@testbroker.com',
      })
      .expect(201);

    expect(invoice.body.data).toMatchObject({
      loadId,
      shipperRate: 2800,
      carrierRate: 2250,
      grossMargin: 550,
      podAttached: true,
      status: 'draft',
    });
    expect(invoice.body.data.grossMarginPercentage).toBeCloseTo(19.64, 1);

    // 4. Send the invoice
    const sent = await request(app)
      .post(`/api/workflows/invoices/${invoice.body.data.id}/send`)
      .set(headers)
      .send({})
      .expect(200);

    expect(sent.body.data.status).toBe('sent');

    // 5. Close the load
    const closed = await request(app)
      .post(`/api/workflows/loads/${loadId}/close`)
      .set(headers)
      .send({})
      .expect(200);

    expect(closed.body.data.status).toBe('closed');
  });

  it('accepts POD from verify-delivery and allows load close', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send(loadPayload)
      .expect(201);
    const loadId = load.body.data.id;

    // Use verify-delivery as the POD source
    await request(app)
      .post(`/api/workflows/loads/${loadId}/verify-delivery`)
      .set(headers)
      .send({ podSignature: 'Warehouse Dock', deliveryTime: '2026-05-03T10:00:00.000Z' })
      .expect(201);

    const closeResponse = await request(app)
      .post(`/api/workflows/loads/${loadId}/close`)
      .set(headers)
      .send({})
      .expect(200);

    expect(closeResponse.body.data.status).toBe('closed');
  });
});
