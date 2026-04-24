import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { createDataStore, DataStore } from './data-store';

type Role = 'owner' | 'admin' | 'dispatcher';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'dispatcher'];

function getTenantId(req: Request): string | null {
  const tenantHeader = req.header('x-tenant-id');
  const tenantBody = typeof req.body?.tenantId === 'string' ? req.body.tenantId : null;
  const tenantQuery = typeof req.query?.tenantId === 'string' ? req.query.tenantId : null;

  return tenantHeader ?? tenantBody ?? tenantQuery;
}

function requireTenant(req: Request, res: Response, next: NextFunction) {
  const tenantId = getTenantId(req);

  if (!tenantId) {
    return res.status(400).json({
      error: 'tenant_id_required',
      message: 'Provide tenantId via x-tenant-id header, query, or body.',
    });
  }

  req.tenantId = tenantId;
  next();
}

function requireRole(req: Request, res: Response, next: NextFunction) {
  const role = req.header('x-user-role');

  if (!role || !ALLOWED_ROLES.includes(role as Role)) {
    return res.status(403).json({
      error: 'forbidden',
      message: 'A valid x-user-role is required for this endpoint.',
    });
  }

  req.userRole = role as Role;
  next();
}

function initializeSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0,
  });
}

function wrapAsync(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

function registerRoutes(app: express.Express, dataStore: DataStore) {
  app.get('/api/loads', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.listLoads(req.tenantId);
    res.status(200).json({ data, count: data.length });
  }));

  app.post('/api/loads', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.createLoad(req.tenantId, req.body);
    res.status(201).json({ data });
  }));

  app.get('/api/drivers', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.listDrivers(req.tenantId);
    res.status(200).json({ data, count: data.length });
  }));

  app.post('/api/drivers', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.createDriver(req.tenantId, req.body);
    res.status(201).json({ data });
  }));

  app.get('/api/shipments', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.listShipments(req.tenantId);
    res.status(200).json({ data, count: data.length });
  }));

  app.post('/api/shipments', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.createShipment(req.tenantId, req.body);
    res.status(201).json({ data });
  }));
}

export function createApp() {
  const app = express();
  const dataStore = createDataStore();

  initializeSentry();

  app.use(cors());
  app.use(express.json());

  app.get('/health', wrapAsync(async (_req, res) => {
    const database = await dataStore.healthCheck();

    res.status(200).json({
      status: database === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: { database },
    });
  }));

  app.get('/api/health', wrapAsync(async (_req, res) => {
    const database = await dataStore.healthCheck();

    res.status(200).json({
      status: database === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: { database },
    });
  }));

  registerRoutes(app, dataStore);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    Sentry.captureException(err);

    res.status(500).json({
      error: 'internal_server_error',
      message: 'Unexpected API error.',
    });
  });

  return app;
}

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
      userRole: Role;
    }
  }
}
