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
import {
  BillingInterval,
  BillingPlan,
  createStripeBillingPortalSession,
  createStripeCheckoutSession,
  getBillingSyncFromStripeEvent,
  getStripeWebhookSecret,
  StripeEvent,
  verifyStripeWebhookSignature,
} from './billing';
import { createAiUsageStore } from './ai-usage';
import { createStripeWebhookEventStore } from './stripe-webhook-events';

type Role = 'owner' | 'admin' | 'dispatcher';

const ALLOWED_ROLES: Role[] = ['owner', 'admin', 'dispatcher'];
const BILLING_ROLES: Role[] = ['owner', 'admin'];
const BILLING_PLANS: BillingPlan[] = ['starter', 'professional', 'enterprise'];
const BILLING_INTERVALS: BillingInterval[] = ['month', 'year'];
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
  'carrierApplications',
  'invoices',
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

function requireBillingRole(req: Request, res: Response, next: NextFunction) {
  if (!req.userRole || !BILLING_ROLES.includes(req.userRole)) {
    return res.status(403).json({
      error: 'billing_forbidden',
      message: 'Billing actions require owner or admin access.',
    });
  }

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

function getCheckoutPlan(req: Request): BillingPlan {
  const plan = req.body?.plan;

  if (!BILLING_PLANS.includes(plan)) {
    throw new HttpError(400, 'invalid_billing_plan', 'Billing plan must be starter, professional, or enterprise.');
  }

  return plan;
}

function getCheckoutInterval(req: Request): BillingInterval {
  const billingInterval = req.body?.billingInterval ?? 'month';

  if (!BILLING_INTERVALS.includes(billingInterval)) {
    throw new HttpError(400, 'invalid_billing_interval', 'Billing interval must be month or year.');
  }

  return billingInterval;
}

function getCarrierIdFromBillingSync(billingSync: ReturnType<typeof getBillingSyncFromStripeEvent>): string | null {
  return billingSync?.carrierId ?? null;
}

function registerWebhookRoute(app: express.Express, dataStore: DataStore) {
  const webhookEvents = createStripeWebhookEventStore();

  app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), wrapAsync(async (req, res) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
    const signature = req.header('stripe-signature');

    if (!verifyStripeWebhookSignature(rawBody, signature, getStripeWebhookSecret())) {
      res.status(400).json({ error: 'invalid_stripe_signature' });
      return;
    }

    const event = JSON.parse(rawBody.toString('utf8')) as StripeEvent;
    const billingSync = getBillingSyncFromStripeEvent(event);
    const carrierId = getCarrierIdFromBillingSync(billingSync);

    await webhookEvents.upsert({
      eventId: event.id,
      eventType: event.type,
      carrierId,
      status: 'received',
    });

    try {
      if (billingSync) {
        const synced = await dataStore.syncCarrierBilling(billingSync);
        await webhookEvents.upsert({
          eventId: event.id,
          eventType: event.type,
          carrierId,
          status: synced ? 'processed' : 'ignored',
          processedAt: new Date(),
        });
      } else {
        await webhookEvents.upsert({
          eventId: event.id,
          eventType: event.type,
          carrierId,
          status: 'ignored',
          processedAt: new Date(),
        });
      }
    } catch (error) {
      await webhookEvents.upsert({
        eventId: event.id,
        eventType: event.type,
        carrierId,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown webhook processing error',
        processedAt: new Date(),
      });
      throw error;
    }

    res.status(200).json({ received: true });
  }));
}

function registerRoutes(app: express.Express, dataStore: DataStore) {
  const aiUsageStore = createAiUsageStore();

  app.get('/api/billing/status', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const stripeCustomerId = await dataStore.getCarrierStripeCustomerId(getRequiredTenantId(req));
    res.status(200).json({
      data: {
        stripeCustomerId,
        hasStripeCustomer: Boolean(stripeCustomerId),
      },
    });
  }));

  app.post('/api/billing/checkout-session', requireTenant, requireRole, requireBillingRole, wrapAsync(async (req, res) => {
    const carrierId = getRequiredTenantId(req);
    const stripeCustomerId = await dataStore.getCarrierStripeCustomerId(carrierId);

    if (stripeCustomerId) {
      throw new HttpError(
        409,
        'stripe_customer_already_linked',
        'This carrier already has a Stripe customer. Use the Customer Portal to change billing.',
      );
    }

    const url = await createStripeCheckoutSession({
      carrierId,
      stripeCustomerId,
      plan: getCheckoutPlan(req),
      billingInterval: getCheckoutInterval(req),
    });

    res.status(200).json({ data: { url } });
  }));

  app.post('/api/billing/customer-portal', requireTenant, requireRole, requireBillingRole, wrapAsync(async (req, res) => {
    const stripeCustomerId = await dataStore.getCarrierStripeCustomerId(getRequiredTenantId(req));

    if (!stripeCustomerId) {
      throw new HttpError(
        404,
        'stripe_customer_not_found',
        'No Stripe customer is linked to this carrier yet.',
      );
    }

    const url = await createStripeBillingPortalSession(stripeCustomerId);
    res.status(200).json({ data: { url } });
  }));

  app.post('/api/ai-usage/events', requireTenant, requireRole, wrapAsync(async (req, res) => {
    if (!req.body?.feature || typeof req.body.feature !== 'string') {
      throw new HttpError(400, 'ai_usage_feature_required', 'AI usage events require a feature string.');
    }

    const data = await aiUsageStore.record({
      ...req.body,
      carrierId: getRequiredTenantId(req),
    });

    res.status(201).json({ data });
  }));

  app.get('/api/ai-usage/summary', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await aiUsageStore.summarize(getRequiredTenantId(req));
    res.status(200).json({ data });
  }));

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

  app.post('/api/workflows/carrier-applications/:id/approve', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.approveCarrierApplication(getRequiredTenantId(req), req.params.id);
    res.status(200).json({ data });
  }));

  app.post('/api/workflows/loads/:loadId/generate-invoice', requireTenant, requireRole, wrapAsync(async (req, res) => {
    const data = await dataStore.generateInvoice(getRequiredTenantId(req), req.params.loadId, req.body);
    res.status(201).json({ data });
  }));

  app.get('/api/tracking/:loadId', wrapAsync(async (req, res) => {
    const data = await dataStore.getCustomerTracking(req.params.loadId);
    res.status(200).json({ data, count: data.length });
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

  registerWebhookRoute(app, dataStore);
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

    if (err.message === 'stripe_secret_key_required') {
      return res.status(500).json({
        error: 'stripe_secret_key_required',
        message: 'STRIPE_SECRET_KEY is required for billing actions.',
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
