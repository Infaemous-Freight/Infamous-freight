import request from 'supertest';
import { createApp } from '../src/app';

const headers = {
  'x-tenant-id': 'carrier_test_001',
  'x-user-role': 'dispatcher',
};

const adminHeaders = {
  'x-tenant-id': 'carrier_test_001',
  'x-user-role': 'admin',
};

const validApplication = {
  companyName: 'Test Hauling LLC',
  mcNumber: 'MC-999001',
  dotNumber: '1234567',
  ein: '12-3456789',
  contactName: 'Jane Doe',
  contactEmail: 'jane@testhauling.com',
  contactPhone: '555-100-2000',
  address: '100 Freight Ave',
  city: 'Dallas',
  state: 'TX',
  zip: '75201',
  equipmentTypes: ['dry_van', 'flatbed'],
  numberOfTrucks: 3,
  numberOfTrailers: 5,
  factoringCompany: 'QuickPay Factors',
};

describe('carrier onboarding API', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('submits a carrier application and returns a record with pending status', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/carrier-applications')
      .set(headers)
      .send(validApplication)
      .expect(201);

    expect(response.body.data).toMatchObject({
      tenantId: 'carrier_test_001',
      companyName: 'Test Hauling LLC',
      mcNumber: 'MC-999001',
      dotNumber: '1234567',
      status: 'pending',
      documents: [],
    });
    expect(response.body.data.id).toBeTruthy();
    expect(response.body.data.submittedAt).toBeTruthy();
  });

  it('rejects an application with missing required fields', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/carrier-applications')
      .set(headers)
      .send({
        companyName: 'Incomplete Carrier',
      })
      .expect(400);

    expect(response.body.error).toBe('carrier_application_missing_fields');
    expect(response.body.message).toContain('mcNumber');
  });

  it('lists carrier applications for a tenant', async () => {
    const app = createApp();

    await request(app)
      .post('/api/carrier-applications')
      .set(headers)
      .send(validApplication)
      .expect(201);

    const listResponse = await request(app)
      .get('/api/carrier-applications')
      .set(headers)
      .expect(200);

    expect(listResponse.body.count).toBe(1);
    expect(listResponse.body.data[0].companyName).toBe('Test Hauling LLC');
  });

  it('retrieves a single carrier application by ID', async () => {
    const app = createApp();

    const createResponse = await request(app)
      .post('/api/carrier-applications')
      .set(headers)
      .send(validApplication)
      .expect(201);

    const id = createResponse.body.data.id;

    const getResponse = await request(app)
      .get(`/api/carrier-applications/${id}`)
      .set(headers)
      .expect(200);

    expect(getResponse.body.data.id).toBe(id);
    expect(getResponse.body.data.mcNumber).toBe('MC-999001');
  });

  it('returns 404 when retrieving a non-existent carrier application', async () => {
    const app = createApp();

    const response = await request(app)
      .get('/api/carrier-applications/does-not-exist')
      .set(headers)
      .expect(404);

    expect(response.body.error).toBe('carrier_application_not_found');
  });

  it('advances carrier application through the full approval workflow', async () => {
    const app = createApp();

    const createResponse = await request(app)
      .post('/api/carrier-applications')
      .set(headers)
      .send(validApplication)
      .expect(201);

    const id = createResponse.body.data.id;

    // Move to under_review
    const reviewResponse = await request(app)
      .patch(`/api/carrier-applications/${id}/status`)
      .set(adminHeaders)
      .send({ status: 'under_review', reviewNotes: 'Checking MC and DOT numbers.' })
      .expect(200);

    expect(reviewResponse.body.data.status).toBe('under_review');
    expect(reviewResponse.body.data.reviewNotes).toBe('Checking MC and DOT numbers.');
    expect(reviewResponse.body.data.reviewedAt).toBeTruthy();

    // Approve the carrier
    const approveResponse = await request(app)
      .patch(`/api/carrier-applications/${id}/status`)
      .set(adminHeaders)
      .send({ status: 'approved', reviewNotes: 'All vetting steps passed. Carrier approved.' })
      .expect(200);

    expect(approveResponse.body.data.status).toBe('approved');
    expect(approveResponse.body.data.approvedAt).toBeTruthy();
    expect(approveResponse.body.data.reviewNotes).toBe('All vetting steps passed. Carrier approved.');
  });

  it('rejects a carrier application with notes', async () => {
    const app = createApp();

    const createResponse = await request(app)
      .post('/api/carrier-applications')
      .set(headers)
      .send(validApplication)
      .expect(201);

    const id = createResponse.body.data.id;

    const rejectResponse = await request(app)
      .patch(`/api/carrier-applications/${id}/status`)
      .set(adminHeaders)
      .send({ status: 'rejected', reviewNotes: 'Insurance mismatch detected.' })
      .expect(200);

    expect(rejectResponse.body.data.status).toBe('rejected');
    expect(rejectResponse.body.data.rejectedAt).toBeTruthy();
    expect(rejectResponse.body.data.reviewNotes).toBe('Insurance mismatch detected.');
  });

  it('rejects an invalid status value', async () => {
    const app = createApp();

    const createResponse = await request(app)
      .post('/api/carrier-applications')
      .set(headers)
      .send(validApplication)
      .expect(201);

    const id = createResponse.body.data.id;

    const response = await request(app)
      .patch(`/api/carrier-applications/${id}/status`)
      .set(adminHeaders)
      .send({ status: 'invalid_status' })
      .expect(400);

    expect(response.body.error).toBe('invalid_carrier_application_status');
  });

  it('isolates carrier applications by tenant', async () => {
    const app = createApp();

    await request(app)
      .post('/api/carrier-applications')
      .set(headers)
      .send(validApplication)
      .expect(201);

    const otherTenantResponse = await request(app)
      .get('/api/carrier-applications')
      .set({ ...headers, 'x-tenant-id': 'carrier_other_999' })
      .expect(200);

    expect(otherTenantResponse.body.count).toBe(0);
    expect(otherTenantResponse.body.data).toEqual([]);
  });

  it('requires tenant and role headers for carrier application endpoints', async () => {
    const app = createApp();

    await request(app)
      .get('/api/carrier-applications')
      .set({ 'x-user-role': 'dispatcher' })
      .expect(400);

    await request(app)
      .get('/api/carrier-applications')
      .set({ 'x-tenant-id': 'carrier_test_001' })
      .expect(403);
  });
});
