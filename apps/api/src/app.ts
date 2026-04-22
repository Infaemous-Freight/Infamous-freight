import cors from 'cors';
import express from 'express';
import { requireAuth, requireRole } from './auth';
import { AppError } from './errors';
import { getAiDecisionLogsForTenant, recordAiDecision, upsertBillingEvent } from './event-store';
import type { AppRequest } from './runtime-types';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', (_req, res) => {
    res.status(200).json({
      status: 'ready',
      uptimeSeconds: process.uptime(),
    });
  });

  app.get('/api/session', requireAuth, (req: AppRequest, res) => {
    res.status(200).json({
      userId: req.context?.userId,
      tenantId: req.context?.tenantId,
      role: req.context?.role,
    });
  });

  app.get('/api/admin/ping', requireAuth, requireRole(['owner', 'accountant']), (req: AppRequest, res) => {
    res.status(200).json({
      ok: true,
      tenantId: req.context?.tenantId,
    });
  });

  app.post('/api/ai/decisions', requireAuth, requireRole(['owner', 'dispatcher', 'safety']), (req: AppRequest, res, next) => {
    const context = req.context;
    if (!context) {
      return next(new AppError(401, 'Unauthenticated'));
    }

    const { decisionType, model, input, output } = req.body as {
      decisionType?: string;
      model?: string;
      input?: unknown;
      output?: unknown;
    };

    if (!decisionType || !model) {
      return next(new AppError(400, 'decisionType and model are required'));
    }

    const log = recordAiDecision({
      tenantId: context.tenantId,
      userId: context.userId,
      decisionType,
      model,
      input,
      output,
    });

    return res.status(201).json(log);
  });

  app.get('/api/ai/decisions', requireAuth, requireRole(['owner', 'dispatcher', 'safety']), (req: AppRequest, res, next) => {
    const tenantId = req.context?.tenantId;

    if (!tenantId) {
      return next(new AppError(401, 'Unauthenticated'));
    }

    return res.status(200).json(getAiDecisionLogsForTenant(tenantId));
  });

  app.post('/api/billing/events', requireAuth, requireRole(['owner', 'accountant']), (req: AppRequest, res, next) => {
    const context = req.context;
    if (!context) {
      return next(new AppError(401, 'Unauthenticated'));
    }

    const { idempotencyKey, eventType, payload } = req.body as {
      idempotencyKey?: string;
      eventType?: string;
      payload?: unknown;
    };

    if (!idempotencyKey || !eventType) {
      return next(new AppError(400, 'idempotencyKey and eventType are required'));
    }

    const { event, deduplicated } = upsertBillingEvent({
      tenantId: context.tenantId,
      idempotencyKey,
      eventType,
      payload,
    });

    return res.status(200).json({
      deduplicated,
      event,
    });
  });

  app.use((err: Error, _req: AppRequest, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        error: err.message,
      });
    }

    const parseError = err as Error & { status?: number; type?: string };
    if (parseError.status === 400 && parseError.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: 'Invalid JSON body',
      });
    }
    return res.status(500).json({
      error: 'Internal server error',
    });
  });

  return app;
}
