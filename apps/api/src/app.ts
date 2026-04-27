import cors from 'cors';
import helmet from 'helmet';
import express, { NextFunction, Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import jwt from 'jsonwebtoken';
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
];
const LOAD_ASSIGNMENT_DECISIONS: LoadAssignmentDecision[] = ['accepted', 'rejected'];

export type AuthClaims = {
  sub: string;
  tenantId: string;
  role: Role;
};

class HttpError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required.');
  }
  return secret;
}

/**
 * Verifies the Bearer JWT in the Authorization header.
 * On success, attaches tenantId and userRole to the request from the token claims.
 * These values are derived server-side from a cryptographically verified token,
 * not from caller-controlled headers.
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'A valid Bearer token is required.',
    });
  }

  const token = authHeader.slice(7);

  let claims: AuthClaims;
  try {
    claims = jwt.verify(token, getJwtSecret()) as AuthClaims;
  } catch {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Token is invalid or expired.',
    });
  }

  if (!claims.tenantId || typeof claims.tenantId !== 'string') {
    return res.status(403).json({
      error: 'forbidden',
      message: 'Token is missing required tenantId claim.',
    });
  }

  if (!claims.role || !ALLOWED_ROLES.includes(claims.role)) {
    return res.status(403).json({
      error: 'forbidden',
      message: 'Token is missing a valid role claim.',
    });
  }

  req.tenantId = claims.tenantId;
  req.userRole = claims.role;
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
      401,
      'unauthorized',
      'No authenticated identity found on the request.',
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

  app.get('/api/billing/status', requireAuth, wrapAsync(async (req, res) => {
    const stripeCustomerId = await dataStore.getCarrierStripeCustomerId(getRequiredTenantId(req));
    res.status(200).json({
      data: {
        stripeCustomerId,
        hasStripeCustomer: Boolean(stripeCustomerId),
      },
    });
  }));

  app.post('/api/billing/checkout-session', requireAuth, requireBillingRole, wrapAsync(async (req, res) => {
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

  app.post('/api/billing/customer-portal', requireAuth, requireBillingRole, wrapAsync(async (req, res) => {
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

  app.post('/api/ai-usage/events', requireAuth, wrapAsync(async (req, res) => {
    if (!req.body?.feature || typeof req.body.feature !== 'string') {
      throw new HttpError(400, 'ai_usage_feature_required', 'AI usage events require a feature string.');
    }

    const data = await aiUsageStore.record({
      ...req.body,
      carrierId: getRequiredTenantId(req),
    });

    res.status(201).json({ data });
  }));

  app.get('/api/ai-usage/summary', requireAuth, wrapAsync(async (req, res) => {
    const data = await aiUsageStore.summarize(getRequiredTenantId(req));
    res.status(200).json({ data });
  }));

  app.get('/api/loads', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.listLoads(getRequiredTenantId(req));
    res.status(200).json({ data, count: data.length });
  }));

  app.post('/api/loads', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.createLoad(getRequiredTenantId(req), req.body);
    res.status(201).json({ data });
  }));

  app.get('/api/drivers', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.listDrivers(getRequiredTenantId(req));
    res.status(200).json({ data, count: data.length });
  }));

  app.post('/api/drivers', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.createDriver(getRequiredTenantId(req), req.body);
    res.status(201).json({ data });
  }));

  app.get('/api/shipments', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.listShipments(getRequiredTenantId(req));
    res.status(200).json({ data, count: data.length });
  }));

  app.post('/api/shipments', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.createShipment(getRequiredTenantId(req), req.body);
    res.status(201).json({ data });
  }));

  app.get('/api/freight-operations/:resource', requireAuth, wrapAsync(async (req, res) => {
    const resource = getFreightOperationResource(req);
    const data = await dataStore.listFreightOperations(resource, getRequiredTenantId(req));
    res.status(200).json({ data, count: data.length });
  }));

  app.post('/api/freight-operations/:resource', requireAuth, wrapAsync(async (req, res) => {
    const resource = getFreightOperationResource(req);
    const data = await dataStore.createFreightOperation(resource, getRequiredTenantId(req), req.body);
    res.status(201).json({ data });
  }));

  app.patch('/api/freight-operations/:resource/:id', requireAuth, wrapAsync(async (req, res) => {
    const resource = getFreightOperationResource(req);
    const data = await dataStore.updateFreightOperation(
      resource,
      getRequiredTenantId(req),
      req.params.id,
      req.body,
    );
    res.status(200).json({ data });
  }));

  app.post('/api/workflows/quotes/:id/convert-to-load', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.convertQuoteToLoad(getRequiredTenantId(req), req.params.id, req.body);
    res.status(201).json({ data });
  }));

  app.post('/api/workflows/load-assignments/:id/:decision', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.respondToLoadAssignment(
      getRequiredTenantId(req),
      req.params.id,
      getLoadAssignmentDecision(req),
      req.body,
    );
    res.status(200).json({ data });
  }));

  app.post('/api/workflows/dispatches/:id/confirm', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.confirmDispatch(getRequiredTenantId(req), req.params.id, req.body);
    res.status(200).json({ data });
  }));

  app.post('/api/workflows/loads/:loadId/tracking-updates', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.recordTrackingUpdate(getRequiredTenantId(req), req.params.loadId, req.body);
    res.status(201).json({ data });
  }));

  app.post('/api/workflows/loads/:loadId/verify-delivery', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.verifyDelivery(getRequiredTenantId(req), req.params.loadId, req.body);
    res.status(201).json({ data });
  }));

  app.post('/api/workflows/carrier-payments/:id/status', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.updateCarrierPaymentStatus(getRequiredTenantId(req), req.params.id, req.body);
    res.status(200).json({ data });
  }));

  app.post('/api/workflows/operational-metrics/rollup', requireAuth, wrapAsync(async (req, res) => {
    const data = await dataStore.rollupOperationalMetrics(getRequiredTenantId(req), req.body);
    res.status(201).json({ data });
  }));

  app.post('/api/workflows/load-board-posts/:id/status', requireAuth, wrapAsync(async (req, res) => {
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
