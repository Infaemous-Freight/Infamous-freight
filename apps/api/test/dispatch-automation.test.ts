import request from 'supertest';
import { createApp } from '../src/app';

describe('dispatch automation routes', () => {
  it('returns risk score and controls', async () => {
    const response = await request(createApp())
      .post('/api/dispatch/risk-score')
      .set('x-tenant-id', 'tenant-1')
      .set('x-user-role', 'dispatcher')
      .set('x-subscription-status', 'active')
      .send({ loadId: 'load-1', etaDriftMinutes: 95, hosRemainingMinutes: 20, receiverDelayMinutes: 55, podUploaded: false });

    expect(response.status).toBe(200);
    expect(response.body.data.score).toBeGreaterThanOrEqual(50);
    expect(response.body.data.controls.hosEscalation).toBe(true);
    expect(response.body.data.controls.receiverReappointment).toBe(true);
    expect(response.body.data.controls.podEnforcement).toBe(true);
  });

  it('returns escalation incident payload', async () => {
    const response = await request(createApp())
      .post('/api/dispatch/escalate')
      .set('x-tenant-id', 'tenant-1')
      .set('x-user-role', 'dispatcher')
      .set('x-subscription-status', 'active')
      .send({ loadId: 'load-2', etaDriftMinutes: 150, hosRemainingMinutes: 15, receiverDelayMinutes: 75, podUploaded: false });

    expect(response.status).toBe(201);
    expect(response.body.data.incidentId).toBeDefined();
    expect(response.body.data.automations.criticalIncidentGenerated).toBe(true);
    expect(response.body.data.automations.slaTimerStart).toBe(true);
  });

  it('rejects escalation when tenant id is missing', async () => {
    const response = await request(createApp())
      .post('/api/dispatch/escalate')
      .set('x-user-role', 'dispatcher')
      .set('x-subscription-status', 'active')
      .send({ loadId: 'load-2', etaDriftMinutes: 40 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('tenant_id_required');
  });

  it('rejects invalid severity value', async () => {
    const response = await request(createApp())
      .post('/api/dispatch/escalate')
      .set('x-tenant-id', 'tenant-1')
      .set('x-user-role', 'dispatcher')
      .set('x-subscription-status', 'active')
      .send({ loadId: 'load-2', severity: 'urgent' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('invalid_request_body');
  });
});
