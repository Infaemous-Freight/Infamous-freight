import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
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

type EscalationInput = DispatchRiskInput & {
  severity?: unknown;
};

class DispatchAutomationHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function wrapAsync(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

function getRequiredTenantId(req: TenantRequest): string {
  if (typeof req.tenantId !== 'string' || req.tenantId.trim().length === 0) {
    throw new DispatchAutomationHttpError(
      400,
      'tenant_id_required',
      'Provide tenantId via the x-tenant-id header.',
    );
  }

  return req.tenantId;
}

function asNumber(value: unknown, fieldName: string): number {
  if (value === undefined || value === null) {
    return 0;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new DispatchAutomationHttpError(
      400,
      'invalid_request_body',
      `${fieldName} must be a finite number when provided.`,
    );
  }

  return Math.max(0, value);
}

function asBoolean(value: unknown, fieldName: string): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value !== 'boolean') {
    throw new DispatchAutomationHttpError(
      400,
      'invalid_request_body',
      `${fieldName} must be a boolean when provided.`,
    );
  }

  return value;
}

function resolveSeverity(raw: unknown, fallback: DispatchRiskLevel): DispatchRiskLevel {
  if (raw === undefined || raw === null || raw === '') {
    return fallback;
  }

  if (raw === 'low' || raw === 'moderate' || raw === 'high' || raw === 'critical') {
    return raw;
  }

  throw new DispatchAutomationHttpError(
    400,
    'invalid_request_body',
    'severity must be one of: low, moderate, high, critical.',
  );
}

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
    factors: {
      etaDriftMinutes,
      hosRemainingMinutes,
      receiverDelayMinutes,
      podUploaded,
    },
    controls: {
      hosEscalation: hosRemainingMinutes <= 60,
      podEnforcement: !podUploaded,
      receiverReappointment: receiverDelayMinutes >= 45,
      slaTimerStart: score >= 50,
    },
  };
}

function getAuditActor(req: Request): { userId: string; userName: string; requestId: string } {
  const requestId = typeof req.requestId === 'string' ? req.requestId : randomUUID();
  const userId = typeof req.authenticatedUser?.userId === 'string' ? req.authenticatedUser.userId : requestId;
  const userName = typeof req.userRole === 'string' ? req.userRole : 'dispatcher';

  return { userId, userName, requestId };
}

export function createDispatchAutomationRouter(auditLogger: AuditLogger): Router {
  const router = Router();

  router.post('/risk-score', wrapAsync(async (req: TenantRequest, res: Response) => {
    const tenantId = getRequiredTenantId(req);
    const payload = req.body as DispatchRiskInput;
    const risk = calculateRiskScore(payload);
    const loadId = typeof payload.loadId === 'string' ? payload.loadId : 'unknown';
    const actor = getAuditActor(req);

    await auditLogger.log({
      entityType: 'dispatchRisk',
      entityId: loadId,
      action: 'risk_score.calculated',
      userId: actor.userId,
      userName: actor.userName,
      details: JSON.stringify({ tenantId, score: risk.score, level: risk.level }),
      requestId: actor.requestId,
    });

    res.status(200).json({ data: risk });
  }));

  router.post('/escalate', wrapAsync(async (req: TenantRequest, res: Response) => {
    const tenantId = getRequiredTenantId(req);
    const payload = req.body as EscalationInput;
    const risk = calculateRiskScore(payload);
    const incidentId = randomUUID();
    const severity = resolveSeverity(payload.severity, risk.level);

    const incident = {
      incidentId,
      tenantId,
      loadId: typeof payload.loadId === 'string' ? payload.loadId : null,
      severity,
      summary: severity === 'critical' ? 'Critical dispatch incident generated.' : 'Dispatch escalation generated.',
      automations: {
        criticalIncidentGenerated: severity === 'critical',
        hosEscalation: risk.controls.hosEscalation,
        podEnforcement: risk.controls.podEnforcement,
        receiverReappointment: risk.controls.receiverReappointment,
        slaTimerStart: risk.controls.slaTimerStart,
      },
      risk,
      createdAt: new Date().toISOString(),
    };

    const actor = getAuditActor(req);

    await auditLogger.log({
      entityType: 'dispatchIncident',
      entityId: incidentId,
      action: 'dispatch.escalated',
      userId: actor.userId,
      userName: actor.userName,
      details: JSON.stringify({ tenantId, severity, loadId: incident.loadId }),
      requestId: actor.requestId,
    });

    res.status(201).json({ data: incident });
  }));

  router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof DispatchAutomationHttpError) {
      return res.status(err.statusCode).json({
        error: err.code,
        message: err.message,
      });
    }

    next(err);
  });

  return router;
}
