import express from 'express';
import request from 'supertest';
import { createDispatchAutomationRouter } from '../src/dispatch-automation';

const auditLogger = { log: jest.fn().mockResolvedValue(undefined) };

function appFactory() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.tenantId = req.header('x-tenant-id') ?? undefined;
    next();
  });
  app.use('/api/dispatch', createDispatchAutomationRouter(auditLogger as any, null));
  return app;
}

describe('dispatch automation router', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns playbook guidance', async () => {
    const res = await request(appFactory())
      .post('/api/dispatch/playbook')
      .set('x-tenant-id', 'tenant-1')
      .send({ etaDriftMinutes: 90, hosRemainingMinutes: 45, podUploaded: false, receiverDelayMinutes: 60 })
      .expect(200);

    expect(res.body.data.steps).toHaveLength(4);
    expect(res.body.data.risk.level).toBe('critical');
  });

  it('calculates risk score and logs audit', async () => {
    const res = await request(appFactory())
      .post('/api/dispatch/risk-score')
      .set('x-tenant-id', 'tenant-1')
      .send({ loadId: 'load-1', etaDriftMinutes: 30, hosRemainingMinutes: 120, receiverDelayMinutes: 0, podUploaded: true })
      .expect(200);

    expect(res.body.data.score).toBeGreaterThan(0);
    expect(auditLogger.log).toHaveBeenCalled();
  });

  it('escalates without provider configuration using safe no-op notifications', async () => {
    const res = await request(appFactory())
      .post('/api/dispatch/escalate')
      .set('x-tenant-id', 'tenant-1')
      .send({ loadId: 'load-99', etaDriftMinutes: 180, hosRemainingMinutes: 30, receiverDelayMinutes: 60, podUploaded: false })
      .expect(201);

    expect(res.body.data.notification).toEqual({ slack: 'skipped', sms: 'skipped' });
  });

  it('validates tenant header', async () => {
    await request(appFactory())
      .post('/api/dispatch/risk-score')
      .send({ etaDriftMinutes: 10 })
      .expect(400);
  });
});
