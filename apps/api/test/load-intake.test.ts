import request from 'supertest';
import { createApp } from '../src/app';
import { calculateGenesisPriority, validateLoadIntakePayload } from '../src/load-intake';

const headers = {
  'x-tenant-id': 'carrier-load-intake-test',
  'x-user-role': 'dispatcher',
  'x-subscription-status': 'active',
};

const validPayload = {
  brokerName: 'Genesis Test Broker',
  brokerMc: 'MC123456',
  originCity: 'Dallas',
  originState: 'tx',
  originLat: 32.7767,
  originLng: -96.797,
  destCity: 'Atlanta',
  destState: 'ga',
  destLat: 33.749,
  destLng: -84.388,
  distance: 781,
  rate: 3200,
  equipmentType: 'reefer',
  weight: 44500,
  pickupDate: '2026-06-05T12:00:00.000Z',
  deliveryDate: '2026-06-06T12:00:00.000Z',
  specialInstructions: 'Protect temperature-sensitive freight.',
};

describe('load intake validation and Genesis scoring', () => {
  it('normalizes a valid intake payload and derives rate per mile', () => {
    const result = validateLoadIntakePayload(validPayload);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.originState).toBe('TX');
      expect(result.value.destState).toBe('GA');
      expect(result.value.equipmentType).toBe('reefer');
      expect(result.value.ratePerMile).toBe(4.1);
    }
  });

  it('rejects invalid coordinates, missing dates, and unsupported equipment', () => {
    const result = validateLoadIntakePayload({
      ...validPayload,
      originLat: 120,
      equipmentType: 'spaceship',
      pickupDate: 'not-a-date',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(expect.arrayContaining([
        'originLat must be between -90 and 90.',
        'pickupDate is required.',
        'equipmentType must be a supported freight equipment type.',
      ]));
    }
  });

  it('assigns high Genesis priority to urgent premium specialized loads', () => {
    const validation = validateLoadIntakePayload(validPayload);
    expect(validation.ok).toBe(true);

    if (validation.ok) {
      const priority = calculateGenesisPriority(validation.value, new Date('2026-06-05T00:00:00.000Z'));
      expect(priority.level).toBe('critical');
      expect(priority.score).toBeGreaterThanOrEqual(85);
      expect(priority.reasons).toEqual(expect.arrayContaining([
        'pickup_within_12_hours',
        'premium_rate_per_mile',
        'specialized_equipment',
      ]));
    }
  });
});

describe('/api/loads/intake', () => {
  it('creates a tenant-scoped load intake, load, and queued dispatcher notification', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/loads/intake')
      .set(headers)
      .send(validPayload)
      .expect(201);

    expect(response.body.data).toMatchObject({
      load: {
        tenantId: headers['x-tenant-id'],
        brokerName: validPayload.brokerName,
        status: 'intake_pending',
      },
      priority: {
        level: 'critical',
      },
      notification: {
        status: 'queued',
        channel: 'dispatcher_queue',
      },
    });

    const loadsResponse = await request(app)
      .get('/api/loads')
      .set(headers)
      .expect(200);

    expect(loadsResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: response.body.data.load.id, tenantId: headers['x-tenant-id'] }),
      ]),
    );
  });

  it('rejects invalid intake without creating a load', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/loads/intake')
      .set(headers)
      .send({ ...validPayload, rate: 0 })
      .expect(400);

    expect(response.body.error).toBe('load_intake_invalid');
  });
});
