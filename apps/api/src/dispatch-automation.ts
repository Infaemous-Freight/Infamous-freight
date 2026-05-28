import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { AuditLogger } from './audit-logger';

type TenantRequest = Request & { tenantId?: string };
type DispatchRiskLevel = 'low' | 'moderate' | 'high' | 'critical';

type DispatchRiskInput = {
  loadId?: unknown;
  etaDriftMinutes?: unknown;
  hosRemainingMinutes?: unknown;
  podUploaded?: unknown;
  receiverDelayMinutes?: unknown;
};

type EscalationInput = DispatchRiskInput & { severity?: unknown };

class DispatchAutomationHttpError extends Error {
  constructor(public readonly statusCode: number, public readonly code: string, message: string) {
    super(message);
  }
}

const DISPATCH_SLACK_WEBHOOK = process.env.DISPATCH_SLACK_WEBHOOK_URL?.trim() ?? '';
const DISPATCH_TWILIO_SID = process.env.DISPATCH_TWILIO_ACCOUNT_SID?.trim() ?? '';
const DISPATCH_TWILIO_TOKEN = process.env.DISPATCH_TWILIO_AUTH_TOKEN?.trim() ?? '';
const DISPATCH_TWILIO_FROM = process.env.DISPATCH_TWILIO_FROM_NUMBER?.trim() ?? '';
const DISPATCH_TWILIO_TO = process.env.DISPATCH_TWILIO_TO_NUMBER?.trim() ?? '';

function wrapAsync(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => void handler(req, res, next).catch(next);
}

function getRequiredTenantId(req: TenantRequest): string {
  if (!req.tenantId?.trim()) throw new DispatchAutomationHttpError(400, 'tenant_id_required', 'Provide tenantId via the x-tenant-id header.');
  return req.tenantId;
}
const asNumber = (v: unknown, f: string) => {
  if (v == null) return 0;
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new DispatchAutomationHttpError(400, 'invalid_request_body', `${f} must be a finite number when provided.`);
  return Math.max(0, v);
};
const asBoolean = (v: unknown, f: string) => {
  if (v == null) return false;
  if (typeof v !== 'boolean') throw new DispatchAutomationHttpError(400, 'invalid_request_body', `${f} must be a boolean when provided.`);
  return v;
};

function calculateRiskScore(input: DispatchRiskInput) {
  const etaDriftMinutes = asNumber(input.etaDriftMinutes, 'etaDriftMinutes');
  const hosRemainingMinutes = asNumber(input.hosRemainingMinutes, 'hosRemainingMinutes');
  const receiverDelayMinutes = asNumber(input.receiverDelayMinutes, 'receiverDelayMinutes');
  const podUploaded = asBoolean(input.podUploaded, 'podUploaded');

  const etaRisk = Math.min(35, Math.round(etaDriftMinutes / 3));
  const hosRisk = hosRemainingMinutes <= 0 ? 40 : Math.min(40, Math.round((180 - hosRemainingMinutes) / 4));
  const receiverRisk = Math.min(20, Math.round(receiverDelayMinutes / 6));
  const podRisk = podUploaded ? 0 : 10;
  const score = Math.max(0, Math.min(100, etaRisk + hosRisk + receiverRisk + podRisk));
  const level: DispatchRiskLevel = score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'moderate' : 'low';

  return {
    score,
    level,
    factors: { etaDriftMinutes, hosRemainingMinutes, receiverDelayMinutes, podUploaded },
    controls: {
      hosEscalation: hosRemainingMinutes <= 60,
      podEnforcement: !podUploaded,
      receiverReappointment: receiverDelayMinutes >= 45,
      slaTimerStart: score >= 50,
    },
  };
}

function getAuditActor(req: Request) {
  const requestId = typeof req.requestId === 'string' ? req.requestId : randomUUID();
  const userId = typeof req.authenticatedUser?.userId === 'string' ? req.authenticatedUser.userId : requestId;
  const userName = typeof req.userRole === 'string' ? req.userRole : 'dispatcher';
  return { userId, userName, requestId };
}

async function notifySlack(message: string): Promise<'sent' | 'skipped'> {
  if (!DISPATCH_SLACK_WEBHOOK) return 'skipped';
  await fetch(DISPATCH_SLACK_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: message }) });
  return 'sent';
}

async function notifyTwilio(message: string): Promise<'sent' | 'skipped'> {
  if (!DISPATCH_TWILIO_SID || !DISPATCH_TWILIO_TOKEN || !DISPATCH_TWILIO_FROM || !DISPATCH_TWILIO_TO) return 'skipped';
  const body = new URLSearchParams({ From: DISPATCH_TWILIO_FROM, To: DISPATCH_TWILIO_TO, Body: message });
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${DISPATCH_TWILIO_SID}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${DISPATCH_TWILIO_SID}:${DISPATCH_TWILIO_TOKEN}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  return 'sent';
}

export function createDispatchAutomationRouter(auditLogger: AuditLogger, prisma: PrismaClient | null = null): Router {
  const router = Router();

  router.post('/playbook', wrapAsync(async (req: TenantRequest, res) => {
    const tenantId = getRequiredTenantId(req);
    const risk = calculateRiskScore(req.body as DispatchRiskInput);
    const steps = [
      'Run ETA drift triage and contact carrier.',
      risk.controls.hosEscalation ? 'Escalate HOS intervention and shift relay options.' : 'HOS in acceptable range.',
      risk.controls.podEnforcement ? 'Start POD recovery workflow with receiver.' : 'POD already uploaded.',
      risk.controls.receiverReappointment ? 'Start receiver reappointment workflow.' : 'Receiver delay below reappointment threshold.',
    ];
    res.status(200).json({ data: { tenantId, steps, risk } });
  }));

  router.post('/risk-score', wrapAsync(async (req: TenantRequest, res) => {
    const tenantId = getRequiredTenantId(req);
    const payload = req.body as DispatchRiskInput;
    const risk = calculateRiskScore(payload);
    const loadId = typeof payload.loadId === 'string' ? payload.loadId : 'unknown';
    const actor = getAuditActor(req);

    if (prisma) {
      await prisma.hosRiskEvent.create({ data: { organizationId: tenantId, loadId, score: risk.score, severity: risk.level, metadata: JSON.stringify(risk.factors) } });
    }

    await auditLogger.log({ entityType: 'dispatchRisk', entityId: loadId, action: 'risk_score.calculated', userId: actor.userId, userName: actor.userName, details: JSON.stringify({ tenantId, score: risk.score, level: risk.level }), requestId: actor.requestId });
    res.status(200).json({ data: risk });
  }));

  router.post('/escalate', wrapAsync(async (req: TenantRequest, res) => {
    const tenantId = getRequiredTenantId(req);
    const payload = req.body as EscalationInput;
    const risk = calculateRiskScore(payload);
    const severity = (payload.severity === 'low' || payload.severity === 'moderate' || payload.severity === 'high' || payload.severity === 'critical') ? payload.severity : risk.level;
    const incidentId = randomUUID();
    const loadId = typeof payload.loadId === 'string' ? payload.loadId : null;

    if (prisma) {
      await prisma.dispatchIncident.create({ data: { id: incidentId, organizationId: tenantId, loadId, severity, summary: severity === 'critical' ? 'Critical dispatch incident generated.' : 'Dispatch escalation generated.', riskScore: risk.score, status: 'open' } });
      await prisma.dispatchAlert.create({ data: { organizationId: tenantId, incidentId, channel: 'system', status: 'created', message: `Dispatch escalation created with ${severity} severity.` } });
      if (risk.controls.slaTimerStart) await prisma.dispatchSlaTimer.create({ data: { organizationId: tenantId, incidentId, status: 'running', deadlineAt: new Date(Date.now() + 60 * 60 * 1000) } });
    }

    const notification = `Dispatch escalation for tenant ${tenantId}, severity ${severity}, load ${loadId ?? 'unknown'}, risk ${risk.score}.`;
    const [slack, sms] = await Promise.all([notifySlack(notification), notifyTwilio(notification)]);
    const actor = getAuditActor(req);
    await auditLogger.log({ entityType: 'dispatchIncident', entityId: incidentId, action: 'dispatch.escalated', userId: actor.userId, userName: actor.userName, details: JSON.stringify({ tenantId, severity, loadId, slack, sms }), requestId: actor.requestId });

    res.status(201).json({ data: { incidentId, tenantId, loadId, severity, risk, notification: { slack, sms } } });
  }));

  router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof DispatchAutomationHttpError) return res.status(err.statusCode).json({ error: err.code, message: err.message });
    next(err);
  });

  return router;
}
