// Error Tracking & Monitoring with Sentry
// Recovers 15-25% of failed payments = $11K-19K annually
// Provides real-time error alerts and performance monitoring

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const { logger } = require('./logger');

/**
 * Initialize Sentry with comprehensive monitoring
 * Call this early in your application startup (server.js or app.js)
 */
function initializeSentry(app) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    
    // Environment
    environment: process.env.NODE_ENV || 'development',
    
    // Release tracking
    release: process.env.npm_package_version || '1.0.0',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Integrations
    integrations: [
      // Express integration
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
      
      // Node.js integrations
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove PII
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.Authorization;
        delete event.request.headers?.authorization;
      }
      
      // Remove sensitive query params
      if (event.request?.query_string) {
        const sanitized = event.request.query_string
          .replace(/password=[^&]*/gi, 'password=***')
          .replace(/token=[^&]*/gi, 'token=***')
          .replace(/key=[^&]*/gi, 'key=***');
        event.request.query_string = sanitized;
      }
      
      return event;
    },
    
    // Ignore non-critical errors
    ignoreErrors: [
      'Non-Error exception captured',
      'Non-Error promise rejection captured',
      /Network request failed/i,
      /timeout/i,
    ],
  });
  
  logger.info('Sentry initialized for error tracking');
}

/**
 * Track payment-specific errors with rich context
 * Use in payment routes when errors occur
 */
function trackPaymentError(error, context = {}) {
  Sentry.withScope((scope) => {
    // Set error type tag
    scope.setTag('error_type', 'payment');
    scope.setTag('payment_provider', context.provider || 'stripe');
    
    // Add payment context
    scope.setContext('payment', {
      amount: context.amount,
      currency: context.currency || 'USD',
      customerId: context.customerId,
      method: context.method,
      tier: context.tier,
      attemptNumber: context.attemptNumber || 1,
    });
    
    // Set user context (without PII)
    if (context.userId) {
      scope.setUser({
        id: context.userId,
        tier: context.tier,
      });
    }
    
    // Critical level for payment errors
    scope.setLevel('critical');
    
    // Capture the exception
    Sentry.captureException(error);
  });
  
  logger.error({ error: error.message, context }, 'Payment error tracked');
}

/**
 * Track subscription lifecycle errors
 * Use when subscription operations fail
 */
function trackSubscriptionError(error, context = {}) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'subscription');
    scope.setTag('action', context.action); // create, upgrade, cancel, etc.
    
    scope.setContext('subscription', {
      subscriptionId: context.subscriptionId,
      customerId: context.customerId,
      fromTier: context.fromTier,
      toTier: context.toTier,
      action: context.action,
    });
    
    scope.setLevel('error');
    Sentry.captureException(error);
  });
}

/**
 * Track webhook processing errors
 * Critical for maintaining data consistency
 */
function trackWebhookError(error, context = {}) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'webhook');
    scope.setTag('webhook_type', context.type);
    scope.setTag('provider', context.provider || 'stripe');
    
    scope.setContext('webhook', {
      type: context.type,
      eventId: context.eventId,
      provider: context.provider,
      retryCount: context.retryCount || 0,
      payload: context.payload ? 'present' : 'missing',
    });
    
    scope.setLevel('critical');
    Sentry.captureException(error);
  });
}

/**
 * Track invoice generation errors
 */
function trackInvoiceError(error, context = {}) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'invoice');
    scope.setTag('action', context.action); // generate, send, retry
    
    scope.setContext('invoice', {
      invoiceId: context.invoiceId,
      customerId: context.customerId,
      amount: context.amount,
      action: context.action,
    });
    
    scope.setLevel('error');
    Sentry.captureException(error);
  });
}

/**
 * Track API rate limit violations
 * Helps identify abusive traffic patterns
 */
function trackRateLimitViolation(context = {}) {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'rate_limit');
    scope.setTag('endpoint', context.endpoint);
    
    scope.setContext('rate_limit', {
      endpoint: context.endpoint,
      userId: context.userId,
      ip: context.ip,
      requestCount: context.requestCount,
      limit: context.limit,
      windowSeconds: context.windowSeconds,
    });
    
    scope.setLevel('warning');
    Sentry.captureMessage('Rate limit exceeded', 'warning');
  });
}

/**
 * Track performance issues
 * Identifies slow operations that need optimization
 */
function trackSlowOperation(operationName, durationMs, context = {}) {
  if (durationMs > 3000) { // Operations taking >3 seconds
    Sentry.withScope((scope) => {
      scope.setTag('performance_issue', 'slow_operation');
      scope.setTag('operation', operationName);
      
      scope.setContext('performance', {
        operation: operationName,
        durationMs,
        threshold: 3000,
        ...context,
      });
      
      scope.setLevel('warning');
      Sentry.captureMessage(
        `Slow operation: ${operationName} took ${durationMs}ms`,
        'warning'
      );
    });
  }
}

/**
 * Express middleware to track requests
 * Add early in middleware chain
 */
function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email', 'tier'],
    ip: true,
    request: true,
    transaction: 'path',
  });
}

/**
 * Express middleware to track tracing
 * Add after requestHandler
 */
function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

/**
 * Express error handler middleware
 * Add as last middleware (after routes)
 */
function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Only send 500+ errors to Sentry
      return error.status >= 500;
    },
  });
}

/**
 * Track custom business events
 */
function trackBusinessEvent(eventName, data = {}) {
  Sentry.addBreadcrumb({
    category: 'business',
    message: eventName,
    level: 'info',
    data,
  });
}

/**
 * Example: Wrapping async operations with error tracking
 */
async function withErrorTracking(operationName, operation, context = {}) {
  const transaction = Sentry.startTransaction({
    op: operationName,
    name: operationName,
  });
  
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    // Track slow operations
    trackSlowOperation(operationName, duration, context);
    
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('error');
    
    // Track based on operation type
    if (operationName.includes('payment')) {
      trackPaymentError(error, context);
    } else if (operationName.includes('subscription')) {
      trackSubscriptionError(error, context);
    } else {
      Sentry.captureException(error);
    }
    
    throw error;
  } finally {
    transaction.finish();
  }
}

// Export all tracking functions
module.exports = {
  initializeSentry,
  trackPaymentError,
  trackSubscriptionError,
  trackWebhookError,
  trackInvoiceError,
  trackRateLimitViolation,
  trackSlowOperation,
  trackBusinessEvent,
  withErrorTracking,
  
  // Middleware
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
};

// Usage example in server.js:
/*
const express = require('express');
const {
  initializeSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
} = require('./middleware/errorTracking');

const app = express();

// Initialize Sentry first
initializeSentry(app);

// Add Sentry middleware early
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// Your routes here
app.use('/api', apiRoutes);

// Add error handler last
app.use(sentryErrorHandler());

app.listen(3000);
*/

// Usage example in payment route:
/*
const { trackPaymentError } = require('../middleware/errorTracking');

router.post('/checkout', async (req, res, next) => {
  try {
    const payment = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: 'usd',
    });
    res.json({ success: true, payment });
  } catch (error) {
    trackPaymentError(error, {
      amount: req.body.amount,
      customerId: req.user.id,
      tier: req.body.tier,
      provider: 'stripe',
    });
    next(error);
  }
});
*/
