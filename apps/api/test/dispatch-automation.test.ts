import express from 'express';
import request from 'supertest';
import { createDispatchAutomationRouter } from '../src/dispatch-automation';

describe('dispatch automation routes', () => {
  const auditLogger = { log: jest.fn(async () => undefined) };

  function buildApp() {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as typeof req & { tenantId?: string; userRole?: string }).tenantId = 'tenant-1';
      (req as typeof req & { tenantId?: string; userRole?: string }).userRole = 'dispatcher';
      next();
    });
    app.use('/api/dispatch', createDispatchAutomationRouter(auditLogger));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DISPATCH_ESCALATION_ENABLED = 'true';
    process.env.DISPATCH_SLA_MINUTES = '60';
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/example';
    process.env.TWILIO_ACCOUNT_SID = 'sid';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_NUMBER = '+15555555555';
  });

  it('returns dispatch playbook configuration', async () => {
    const res = await request(buildApp()).get('/api/dispatch/playbook');

    expect(res.status).toBe(200);
    expect(res.body.data.escalationEnabled).toBe(true);
    expect(res.body.data.thresholds.slaMinutes).toBe(60);
    expect(res.body.data.providers.slackEnabled).toBe(true);
    expect(res.body.data.providers.twilioEnabled).toBe(true);
  });

  it('calculates risk score', async () => {
    const res = await request(buildApp()).post('/api/dispatch/risk-score').send({
      loadId: 'load-1',
      etaDriftMinutes: 140,
      hosRemainingMinutes: 30,
      receiverDelayMinutes: 50,
      podUploaded: false,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBeGreaterThanOrEqual(70);
    expect(res.body.data.level).toMatch(/high|critical/);
  });

  it('escalates incident with notifications and sla timer', async () => {
    const res = await request(buildApp()).post('/api/dispatch/escalate').send({
      loadId: 'load-2',
      etaDriftMinutes: 130,
      hosRemainingMinutes: 20,
      receiverDelayMinutes: 90,
      podUploaded: false,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.notifications.slack).toBe(true);
    expect(res.body.data.notifications.twilio).toBe(true);
    expect(res.body.data.sla.targetMinutes).toBe(60);
    expect(new Date(res.body.data.sla.dueAt).toString()).not.toBe('Invalid Date');
  });
});
