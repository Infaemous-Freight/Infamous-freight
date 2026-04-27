import cors from 'cors';
import helmet from 'helmet';
import express, { NextFunction, Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import {
  createDataStore,
  DataStore,
  FreightOperationResource,
  LoadAssignmentDecision,
} from './data-store';

type Role = 'owner' | 'admin' | 'dispatcher';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'dispatcher'];
const FREIGHT_OPERATION_RESOURCES: FreightOperationResource[] = [
  'quoteRequests',
  'loadAssignments',
  'loadDispatches',
  'shipmentTracking',
  'deliveryConfirmations',
  'carrierPayments',
  'rateAgreements',
  'operationalMetrics',
  'loadBoardPosts',
];
const LOAD_ASSIGNMENT_DECISIONS: LoadAssignmentDecision[] = ['accepted', 'rejected'];

class HttpError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function getTenantId(req: Request): string | null {
  const tenantHeader = req.header('x-tenant-id')?.trim();
  const tenantBody = typeof req.body?.tenantId === 'string' ? req.body.tenantId.trim() : null;
  const tenantQuery = typeof req.query?.tenantId === 'string' ? req.query.tenantId.trim() : null;

  return tenantHeader || tenantBody || tenantQuery || null;
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

function getAllowedCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function wrapAsync(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

function getRequiredTenantId(req: Request): string {
  if (!req.tenantId) {
    throw new HttpError(
      400,
      'tenant_id_required',
      'Provide tenantId via x-tenant-id header, query, or body.',
    );
  }

  return req.tenantId;
}

function getFreightOperationResource(req: Request): FreightOperationResource {
  const resource = req.params.resource;

  if (!FREIGHT_OPERATION_RESOURCES.includes(resource as FreightOperationResource)) {
    throw new HttpError(
      404,
      'freight_operation_resource_not_found',
      `Unsupported freight operation resource: ${resource}`,
    );
  }

  return resource as FreightOperationResource;
}

function getLoadAssignmentDecision(req: Request): LoadAssignmentDecision {
  const decision = req.params.decision;

  if (!LOAD_ASSIGNMENT_DECISIONS.includes(decision as LoadAssignmentDecision)) {
    throw new HttpError(
      400,
      'invalid_load_assignment_decision',
      'Load assignment decision must be accepted or rejected.',
    );
  }

  return decision as LoadAssignmentDecision;
}

function registerRoutes(app: express.Express, dataStore: DataStore) {
  app.get('/api/loads', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.listLoads(getRequiredTenantId(req));
    res.status(200).json({ data, count: data.length });
  }));

  app.post('/api/loads', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.createLoad(getRequiredTenantId(req), req.body);
    res.status(201).json({ data });
  }));

  app.get('/api/drivers', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.listDrivers(getRequiredTenantId(req));
    res.status(200).json({ data, count: data.length });
  }));

  app.post('/api/drivers', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.createDriver(getRequiredTenantId(req), req.body);
    res.status(201).json({ data });
  }));

  app.get('/api/shipments', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.listShipments(getRequiredTenantId(req));
    res.status(200).json({ data, count: data.length });
  }));

  app.post('/api/shipments', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.createShipment(getRequiredTenantId(req), req.body);
    res.status(201).json({ data });
  }));

  app.get('/api/freight-operations/:resource', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const resource = getFreightOperationResource(req);
    const data = await dataStore.listFreightOperations(resource, getRequiredTenantId(req));
    res.status(200).json({ data, count: data.length });
  }));

  app.post('/api/freight-operations/:resource', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const resource = getFreightOperationResource(req);
    const data = await dataStore.createFreightOperation(resource, getRequiredTenantId(req), req.body);
    res.status(201).json({ data });
  }));

  app.patch('/api/freight-operations/:resource/:id', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const resource = getFreightOperationResource(req);
    const data = await dataStore.updateFreightOperation(
      resource,
      getRequiredTenantId(req),
      req.params.id,
      req.body,
    );
    res.status(200).json({ data });
  }));

  app.post('/api/workflows/quotes/:id/convert-to-load', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.convertQuoteToLoad(getRequiredTenantId(req), req.params.id, req.body);
    res.status(201).json({ data });
  }));

  app.post('/api/workflows/load-assignments/:id/:decision', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.respondToLoadAssignment(
      getRequiredTenantId(req),
      req.params.id,
      getLoadAssignmentDecision(req),
      req.body,
    );
    res.status(200).json({ data });
  }));

  app.post('/api/workflows/dispatches/:id/confirm', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.confirmDispatch(getRequiredTenantId(req), req.params.id, req.body);
    res.status(200).json({ data });
  }));

  app.post('/api/workflows/loads/:loadId/tracking-updates', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.recordTrackingUpdate(getRequiredTenantId(req), req.params.loadId, req.body);
    res.status(201).json({ data });
  }));

  app.post('/api/workflows/loads/:loadId/verify-delivery', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.verifyDelivery(getRequiredTenantId(req), req.params.loadId, req.body);
    res.status(201).json({ data });
  }));

  app.post('/api/workflows/carrier-payments/:id/status', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.updateCarrierPaymentStatus(getRequiredTenantId(req), req.params.id, req.body);
    res.status(200).json({ data });
  }));

  app.post('/api/workflows/operational-metrics/rollup', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.rollupOperationalMetrics(getRequiredTenantId(req), req.body);
    res.status(201).json({ data });
  }));

  app.post('/api/workflows/load-board-posts/:id/status', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.updateLoadBoardPostStatus(getRequiredTenantId(req), req.params.id, req.body);
    res.status(200).json({ data });
  }));
}

export function createApp() {
  const app = express();
  const dataStore = createDataStore();

  initializeSentry();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const allowedOrigins = getAllowedCorsOrigins();
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === 'production'
          ? allowedOrigins
          : allowedOrigins.length
            ? allowedOrigins
            : true,
      credentials: true,
    }),
  );
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
    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({
        error: err.code,
        message: err.message,
      });
    }

    if (err.message === 'freight_operation_not_found') {
      return res.status(404).json({
        error: 'freight_operation_not_found',
        message: 'Freight operation record was not found for this tenant.',
      });
    }

    if (err.message === 'load_not_found_for_tenant') {
      return res.status(404).json({
        error: 'load_not_found_for_tenant',
        message: 'Referenced load was not found for this tenant.',
      });
    }

    if (err.message === 'quote_request_not_found') {
      return res.status(404).json({
        error: 'quote_request_not_found',
        message: 'Quote request was not found for this tenant.',
      });
    }

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
      tenantId?: string;
      userRole?: Role;
    }
  }
}
