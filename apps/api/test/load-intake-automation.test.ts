import request from 'supertest';
import { createApp } from '../src/app';
import {
  buildQuoteIntakeNotifications,
  prioritizeQuoteWithGenesis,
  validateQuoteIntakePayload,
} from '../src/quote-intake-automation';

const headers = {
  'x-tenant-id': 'carrier_automation',
  'x-user-role': 'dispatcher',
  'x-subscription-status': 'active',
};

const validPayload = {
  brokerName: 'Genesis Brokerage',
  originCity: 'Dallas',
  destCity: 'Atlanta',
  freightType: 'dry_van',
  weight: 42000,
  pickupDate: '2026-06-06T08:00:00.000Z',
  deliveryDeadline: '2026-06-08T08:00:00.000Z',
  shipperRate: 3200,
  carrierCost: 2500,
  contactEmail: 'ops@genesis.example',
};

describe('load intake automation', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('validates and normalizes quote intake payloads', () => {
    const result = validateQuoteIntakePayload(validPayload);

    expect(result).toMatchObject({
      ok: true,
      input: {
        brokerName: 'Genesis Brokerage',
        weight: 42000,
        shipperRate: 3200,
        carrierCost: 2500,
      },
    });
  });

  it('rejects missing, invalid, or unprofitable quote intake payloads', () => {
    const result = validateQuoteIntakePayload({
      ...validPayload,
      brokerName: '',
      shipperRate: 2000,
      carrierCost: 2500,
      contactEmail: 'not-an-email',
    });

    expect(result).toEqual({
      ok: false,
      missing: ['brokerName'],
      invalid: ['contactEmail', 'shipperRate'],
    });
  });

  it('prioritizes quote intake through the Genesis local scoring integration', () => {
    const validation = validateQuoteIntakePayload(validPayload);
    expect(validation.ok).toBe(true);
    if (!validation.ok) return;

    const genesis = prioritizeQuoteWithGenesis(validation.input);

    expect(genesis).toMatchObject({
      provider: 'genesis',
      mode: 'local_scoring',
      priority: expect.stringMatching(/urgent|high|standard|review/),
    });
    expect(genesis.score).toBeGreaterThanOrEqual(0);
    expect(genesis.score).toBeLessThanOrEqual(100);
    expect(genesis.reasons.length).toBeGreaterThan(0);
  });

  it('builds deterministic notification queue items without exposing secrets', () => {
    const notifications = buildQuoteIntakeNotifications({
      tenantId: 'carrier_automation',
      quoteRequestId: 'quote_123',
      brokerName: 'Genesis Brokerage',
      originCity: 'Dallas',
      destCity: 'Atlanta',
      priority: 'high',
    });

    expect(notifications).toEqual([
      expect.objectContaining({
        channel: 'in_app',
        topic: 'quote_intake',
        recipientRole: 'dispatcher',
        dedupeKey: 'carrier_automation:quote_intake:quote_123:dispatcher',
      }),
      expect.objectContaining({
        channel: 'in_app',
        topic: 'quote_intake',
        recipientRole: 'admin',
        dedupeKey: 'carrier_automation:quote_intake:quote_123:admin',
      }),
    ]);
  });

  it('accepts protected POST /api/loads/intake requests and stores tenant-scoped quote requests', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/loads/intake')
      .set(headers)
      .send(validPayload)
      .expect(202);

    expect(response.body.data.quoteRequest).toMatchObject({
      tenantId: 'carrier_automation',
      brokerName: 'Genesis Brokerage',
      originCity: 'Dallas',
      destCity: 'Atlanta',
      freightType: 'dry_van',
      contactEmail: 'ops@genesis.example',
      weight: 42000,
      shipperRate: 3200,
      carrierCost: 2500,
      profitMargin: 700,
      genesisScore: expect.any(Number),
      genesisPriority: expect.stringMatching(/urgent|high|standard|review/),
      genesisReasons: expect.any(Array),
    });
    expect(response.body.data.genesis.provider).toBe('genesis');
    expect(response.body.data.notifications).toHaveLength(2);
    expect(response.body.data.notifications[0]).toMatchObject({
      tenantId: 'carrier_automation',
      quoteRequestId: response.body.data.quoteRequest.id,
      status: 'queued',
      attempts: 0,
    });
    expect(response.body.data.retryQueue).toEqual([]);

    const listResponse = await request(app)
      .get('/api/freight-operations/quoteRequests')
      .set(headers)
      .expect(200);

    expect(listResponse.body.count).toBe(1);
    expect(listResponse.body.data[0].id).toBe(response.body.data.quoteRequest.id);
  });

  it('rejects unauthenticated quote intake automation requests', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/loads/intake')
      .send(validPayload)
      .expect(400);

    expect(response.body.error).toBe('tenant_id_required');
  });

  it('rejects invalid quote intake automation requests', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/loads/intake')
      .set(headers)
      .send({ ...validPayload, deliveryDeadline: '2026-06-01T08:00:00.000Z' })
      .expect(400);

    expect(response.body.error).toBe('quote_intake_validation_failed');
    expect(response.body.message).toContain('deliveryDeadline');
  });
});
