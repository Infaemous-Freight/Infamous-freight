import request from 'supertest';
import { createApp } from '../src/app';

describe('workflow alerts API', () => {
  const tenantId = 'carrier-alerts-test';
  const headers = {
    'x-tenant-id': tenantId,
    'x-user-role': 'dispatcher',
  };

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('returns an empty alerts list when there is no alertable data', async () => {
    const app = createApp();

    const response = await request(app)
      .get('/api/workflows/alerts')
      .set(headers)
      .expect(200);

    expect(response.body.data).toEqual([]);
    expect(response.body.count).toBe(0);
  });

  it('raises a quote_request_received alert for a pending quote request', async () => {
    const app = createApp();

    await request(app)
      .post('/api/freight-operations/quoteRequests')
      .set(headers)
      .send({
        brokerName: 'Alert Test Broker',
        originCity: 'Dallas',
        destCity: 'Chicago',
        freightType: 'dry_van',
        weight: 40000,
        pickupDate: '2026-06-01T10:00:00.000Z',
        shipperRate: 2500,
        carrierCost: 2000,
        profitMargin: 500,
        status: 'pending',
      })
      .expect(201);

    const response = await request(app)
      .get('/api/workflows/alerts')
      .set(headers)
      .expect(200);

    const quoteAlerts = response.body.data.filter(
      (a: { type: string }) => a.type === 'quote_request_received',
    );
    expect(quoteAlerts.length).toBeGreaterThanOrEqual(1);
    expect(quoteAlerts[0]).toMatchObject({
      type: 'quote_request_received',
      severity: 'info',
      entityType: 'quoteRequest',
      tenantId,
    });
  });

  it('raises a carrier_document_reminder alert for a rate agreement with pending status', async () => {
    const app = createApp();

    await request(app)
      .post('/api/freight-operations/rateAgreements')
      .set(headers)
      .send({
        baseRate: 2.50,
        fuelSurcharge: 0.25,
        effectiveDate: '2026-01-01T00:00:00.000Z',
        status: 'pending',
      })
      .expect(201);

    const response = await request(app)
      .get('/api/workflows/alerts')
      .set(headers)
      .expect(200);

    const docAlerts = response.body.data.filter(
      (a: { type: string }) => a.type === 'carrier_document_reminder',
    );
    expect(docAlerts.length).toBeGreaterThanOrEqual(1);
    expect(docAlerts[0]).toMatchObject({
      type: 'carrier_document_reminder',
      severity: 'warning',
      entityType: 'rateAgreement',
      tenantId,
    });
  });

  it('raises an insurance_expiration_reminder alert for a rate agreement expiring within 30 days', async () => {
    const app = createApp();

    const soonExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    await request(app)
      .post('/api/freight-operations/rateAgreements')
      .set(headers)
      .send({
        baseRate: 2.75,
        fuelSurcharge: 0.30,
        effectiveDate: '2026-01-01T00:00:00.000Z',
        expiryDate: soonExpiry,
      })
      .expect(201);

    const response = await request(app)
      .get('/api/workflows/alerts')
      .set(headers)
      .expect(200);

    const expiryAlerts = response.body.data.filter(
      (a: { type: string }) => a.type === 'insurance_expiration_reminder',
    );
    expect(expiryAlerts.length).toBeGreaterThanOrEqual(1);
    expect(expiryAlerts[0]).toMatchObject({
      type: 'insurance_expiration_reminder',
      severity: 'warning',
      entityType: 'rateAgreement',
      tenantId,
    });
  });

  it('raises a stale_load_update alert for an active load with no tracking updates', async () => {
    const app = createApp();

    await request(app)
      .post('/api/loads')
      .set(headers)
      .send({
        brokerName: 'Stale Load Broker',
        originCity: 'Dallas',
        originState: 'TX',
        originLat: 32.7767,
        originLng: -96.797,
        destCity: 'Houston',
        destState: 'TX',
        destLat: 29.7604,
        destLng: -95.3698,
        distance: 240,
        rate: 1800,
        ratePerMile: 7.5,
        equipmentType: 'dry_van',
        weight: 38000,
        pickupDate: '2026-06-01T10:00:00.000Z',
        status: 'in_transit',
      })
      .expect(201);

    const response = await request(app)
      .get('/api/workflows/alerts')
      .set(headers)
      .expect(200);

    const staleAlerts = response.body.data.filter(
      (a: { type: string }) => a.type === 'stale_load_update',
    );
    expect(staleAlerts.length).toBeGreaterThanOrEqual(1);
    expect(staleAlerts[0]).toMatchObject({
      type: 'stale_load_update',
      severity: 'warning',
      entityType: 'load',
      tenantId,
    });
  });

  it('raises a missing_pod_reminder alert for a delivered shipment without POD', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send({
        brokerName: 'POD Test Broker',
        originCity: 'Dallas',
        originState: 'TX',
        originLat: 32.7767,
        originLng: -96.797,
        destCity: 'Austin',
        destState: 'TX',
        destLat: 30.2672,
        destLng: -97.7431,
        distance: 195,
        rate: 1600,
        ratePerMile: 8.2,
        equipmentType: 'dry_van',
        weight: 35000,
        pickupDate: '2026-06-01T10:00:00.000Z',
        status: 'delivered',
      })
      .expect(201);

    // Record a delivered tracking update without POD
    await request(app)
      .post(`/api/workflows/loads/${load.body.data.id}/tracking-updates`)
      .set(headers)
      .send({ status: 'delivered', podReceived: false })
      .expect(201);

    const response = await request(app)
      .get('/api/workflows/alerts')
      .set(headers)
      .expect(200);

    const podAlerts = response.body.data.filter(
      (a: { type: string }) => a.type === 'missing_pod_reminder',
    );
    expect(podAlerts.length).toBeGreaterThanOrEqual(1);
    expect(podAlerts[0]).toMatchObject({
      type: 'missing_pod_reminder',
      severity: 'warning',
      entityType: 'shipmentTracking',
      tenantId,
    });
  });

  it('raises an overdue_invoice alert for a carrier payment still in pending status', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send({
        brokerName: 'Invoice Test Broker',
        originCity: 'Dallas',
        originState: 'TX',
        originLat: 32.7767,
        originLng: -96.797,
        destCity: 'Memphis',
        destState: 'TN',
        destLat: 35.1495,
        destLng: -90.0490,
        distance: 450,
        rate: 2200,
        ratePerMile: 4.89,
        equipmentType: 'dry_van',
        weight: 41000,
        pickupDate: '2026-06-01T10:00:00.000Z',
        status: 'delivered',
      })
      .expect(201);

    await request(app)
      .post('/api/freight-operations/carrierPayments')
      .set(headers)
      .send({ loadId: load.body.data.id, amount: 1900, status: 'pending' })
      .expect(201);

    const response = await request(app)
      .get('/api/workflows/alerts')
      .set(headers)
      .expect(200);

    const invoiceAlerts = response.body.data.filter(
      (a: { type: string }) => a.type === 'overdue_invoice',
    );
    expect(invoiceAlerts.length).toBeGreaterThanOrEqual(1);
    expect(invoiceAlerts[0]).toMatchObject({
      type: 'overdue_invoice',
      severity: 'critical',
      entityType: 'carrierPayment',
      tenantId,
    });
  });

  it('raises an exception_alert for a load with exception status', async () => {
    const app = createApp();

    await request(app)
      .post('/api/loads')
      .set(headers)
      .send({
        brokerName: 'Exception Test Broker',
        originCity: 'Dallas',
        originState: 'TX',
        originLat: 32.7767,
        originLng: -96.797,
        destCity: 'Nashville',
        destState: 'TN',
        destLat: 36.1627,
        destLng: -86.7816,
        distance: 670,
        rate: 2400,
        ratePerMile: 3.58,
        equipmentType: 'dry_van',
        weight: 39000,
        pickupDate: '2026-06-01T10:00:00.000Z',
        status: 'exception',
      })
      .expect(201);

    const response = await request(app)
      .get('/api/workflows/alerts')
      .set(headers)
      .expect(200);

    const exceptionAlerts = response.body.data.filter(
      (a: { type: string }) => a.type === 'exception_alert',
    );
    expect(exceptionAlerts.length).toBeGreaterThanOrEqual(1);
    expect(exceptionAlerts[0]).toMatchObject({
      type: 'exception_alert',
      severity: 'critical',
      entityType: 'load',
      tenantId,
    });
  });

  it('raises an exception_alert for a tracking entry with exception status', async () => {
    const app = createApp();

    const load = await request(app)
      .post('/api/loads')
      .set(headers)
      .send({
        brokerName: 'Tracking Exception Broker',
        originCity: 'Dallas',
        originState: 'TX',
        originLat: 32.7767,
        originLng: -96.797,
        destCity: 'Atlanta',
        destState: 'GA',
        destLat: 33.749,
        destLng: -84.388,
        distance: 781,
        rate: 2600,
        ratePerMile: 3.33,
        equipmentType: 'dry_van',
        weight: 42000,
        pickupDate: '2026-06-01T10:00:00.000Z',
        status: 'in_transit',
      })
      .expect(201);

    await request(app)
      .post(`/api/workflows/loads/${load.body.data.id}/tracking-updates`)
      .set(headers)
      .send({ status: 'exception', latitude: 32.9, longitude: -96.5 })
      .expect(201);

    const response = await request(app)
      .get('/api/workflows/alerts')
      .set(headers)
      .expect(200);

    const exceptionAlerts = response.body.data.filter(
      (a: { type: string }) => a.type === 'exception_alert',
    );
    expect(exceptionAlerts.length).toBeGreaterThanOrEqual(1);
    const trackingException = exceptionAlerts.find(
      (a: { entityType: string }) => a.entityType === 'shipmentTracking',
    );
    expect(trackingException).toMatchObject({
      type: 'exception_alert',
      severity: 'critical',
      entityType: 'shipmentTracking',
      tenantId,
    });
  });

  it('returns alerts with required shape fields', async () => {
    const app = createApp();

    await request(app)
      .post('/api/freight-operations/quoteRequests')
      .set(headers)
      .send({
        brokerName: 'Shape Test Broker',
        originCity: 'Dallas',
        destCity: 'Chicago',
        freightType: 'dry_van',
        weight: 40000,
        pickupDate: '2026-06-01T10:00:00.000Z',
        shipperRate: 2500,
        carrierCost: 2000,
        profitMargin: 500,
        status: 'pending',
      })
      .expect(201);

    const response = await request(app)
      .get('/api/workflows/alerts')
      .set(headers)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(typeof response.body.count).toBe('number');

    for (const alert of response.body.data) {
      expect(typeof alert.id).toBe('string');
      expect(typeof alert.type).toBe('string');
      expect(typeof alert.severity).toBe('string');
      expect(typeof alert.title).toBe('string');
      expect(typeof alert.message).toBe('string');
      expect(typeof alert.entityType).toBe('string');
      expect(typeof alert.entityId).toBe('string');
      expect(typeof alert.tenantId).toBe('string');
      expect(typeof alert.createdAt).toBe('string');
    }
  });

  it('requires a valid tenant ID', async () => {
    const app = createApp();

    await request(app).get('/api/workflows/alerts').expect(400);
  });

  it('requires a valid role', async () => {
    const app = createApp();

    await request(app)
      .get('/api/workflows/alerts')
      .set('x-tenant-id', tenantId)
      .set('x-user-role', 'unknown_role')
      .expect(403);
  });
});
