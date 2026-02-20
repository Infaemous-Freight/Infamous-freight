/**
 * API Middleware Integration Guide
 *
 * This document explains how the middleware stack is organized and where
 * to add new middleware for new features.
 *
 * Correct middleware order is CRITICAL for performance and security.
 * Changing the order can break authentication, caching, or rate limiting.
 */

const express = require('express');

/**
 * MIDDLEWARE ORDER (Critical!)
 *
 * The order of middleware in Express matters because:
 * - Each middleware can modify req/res and call next()
 * - Earlier middleware can prevent later middleware from running
 * - Some middleware depend on earlier middleware (e.g., auth depends on parsing)
 *
 * CORRECT ORDER:
 */

function setupMiddleware(app) {
  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 1: OBSERVABILITY (must be first for accurate metrics)
  // ═══════════════════════════════════════════════════════════════════════════
  const { correlationMiddleware, performanceMiddleware } = require('./middleware/logger');
  app.use(correlationMiddleware); // Add request ID and correlation ID
  app.use(performanceMiddleware); // Track request start time

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 2: SECURITY & PARSING (before authentication)
  // ═══════════════════════════════════════════════════════════════════════════
  const { securityHeaders } = require('./middleware/securityHeaders');
  const { corsMiddleware } = require('./middleware/cors');

  app.set('trust proxy', 1); // Trust X-Forwarded-* headers from load balancer
  securityHeaders(app); // Set security headers (CSP, HSTS, etc.)
  app.use(corsMiddleware()); // CORS preflight handling

  // Parse request bodies AFTER security headers, BEFORE auth
  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Stripe webhooks need raw body - handle BEFORE body parsing
  // (See: apps/api/src/server.js line ~160 for Stripe webhook setup)

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 3: CACHING & PERFORMANCE (before authentication, affects all responses)
  // ═══════════════════════════════════════════════════════════════════════════
  const { cacheResponseMiddleware } = require('./middleware/smartCache');
  const { compressionMiddleware } = require('./middleware/performance');

  app.use(cacheResponseMiddleware()); // Check cache before processing request
  app.use(compressionMiddleware); // Compress responses

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 4: RATE LIMITING & AUTHENTICATION (before routes)
  // ═══════════════════════════════════════════════════════════════════════════
  const { rateLimit } = require('./middleware/security');
  const { authMiddleware: jwtRotationAuth } = require('./auth/jwtRotation');
  const { apiVersioningMiddleware } = require('./middleware/apiVersioning');

  app.use(rateLimit); // Rate limit ALL requests (before auth)
  app.use(jwtRotationAuth()); // JWT parsing and rotation (if configured)
  app.use(apiVersioningMiddleware); // Detect API version from URL/header

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 5: AUDIT & CONTEXT (for tracking mutations)
  // ═══════════════════════════════════════════════════════════════════════════
  const { auditContextMiddleware } = require('./middleware/auditLogging');
  const { withIdempotency } = require('./middleware/idempotency');

  app.use(auditContextMiddleware); // Extract user ID, org ID for audit logs
  app.use(withIdempotency()); // Prevent duplicate operations

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 6: DATA LOADING OPTIMIZATION (for complex queries)
  // ═══════════════════════════════════════════════════════════════════════════
  const { batchLoaderMiddleware } = require('./services/batchLoaders');

  app.use(batchLoaderMiddleware); // Attach DataLoaders to req for batching

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 7: QUERY MONITORING (for performance tracking)
  // ═══════════════════════════════════════════════════════════════════════════
  const { queryMonitor } = require('./middleware/queryMonitoring');

  // Connect Prisma hooks for query monitoring
  // (See: apps/api/src/index.js or apps/api/src/server.js for initialization)
  // Example: prisma.$on('query', queryMonitor.onQuery.bind(queryMonitor));

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 8: LOGGING (after all processing)
  // ═══════════════════════════════════════════════════════════════════════════
  const { httpLogger } = require('./middleware/logger');
  const bodyLoggingMiddleware = require('./middleware/bodyLogging');

  app.use(bodyLoggingMiddleware); // Log request/response bodies (with redaction)
  app.use(httpLogger); // Log HTTP requests

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTES MOUNTED HERE (see apps/api/src/server.js)
  // ═══════════════════════════════════════════════════════════════════════════
  // app.use('/api', healthRoutes);
  // app.use('/api', shipmentRoutes);
  // ... other route mounts ...

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER 9: ERROR HANDLING (must be LAST)
  // ═══════════════════════════════════════════════════════════════════════════
  const errorHandler = require('./middleware/errorHandler');

  app.use(errorHandler); // Catch all errors and return consistent format

  // ═══════════════════════════════════════════════════════════════════════════
  // SENTRY ERROR HANDLER (if using Sentry, after app error handler)
  // ═══════════════════════════════════════════════════════════════════════════
  const { Sentry } = require('./observability/sentry');

  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }
}

/**
 * MIDDLEWARE RESPONSIBILITIES & WHY THEY'RE IN THAT ORDER
 *
 * 1. OBSERVABILITY (Correlation IDs, Performance Timing)
 *    - Must be first to measure full request time
 *    - Adds request ID for distributed tracing
 *
 * 2. SECURITY (CORS, Headers, Parsing)
 *    - Must be early before any untrusted input is processed
 *    - CORS preflight handled here
 *    - Security headers set before anything else
 *
 * 3. CACHING (Response Caching, Compression)
 *    - Before auth so public endpoints also cached
 *    - Compression speeds up all responses
 *
 * 4. RATE LIMITING & AUTH
 *    - Rate limit before auth (protect from brute force)
 *    - Auth before routes (requires req.user)
 *    - API versioning before routes (for conditional behavior)
 *
 * 5. AUDIT & CONTEXT
 *    - Extracts user/org from auth token
 *    - Used by mutation tracking
 *    - Idempotency check prevents duplicate requests
 *
 * 6. DATA LOADING (Batch Loaders)
 *    - Offers efficient query batching to routes
 *    - Must be after auth (has access to user context)
 *
 * 7. QUERY MONITORING
 *    - Tracks performance of data fetches
 *    - Must be before routes call database
 *
 * 8. LOGGING
 *    - Logs final state of request/response
 *    - Must be late to capture all work done
 *
 * 9. ERROR HANDLING
 *    - MUST be last middleware
 *    - Catches errors from all previous middleware
 *    - Returns consistent error format to client
 */

/**
 * HOW TO ADD NEW MIDDLEWARE
 *
 * Example: Adding new feature middleware
 *
 * 1. Create file: apps/api/src/middleware/myFeature.js
 *    Exports a function that returns middleware:
 *
 *    function myFeatureMiddleware(req, res, next) {
 *      // Do something with req
 *      req.myFeature = ...;
 *      next(); // MUST call next() or return response
 *    }
 *    module.exports = myFeatureMiddleware;
 *
 * 2. Determine correct placement based on dependencies:
 *    - Needs req parsed? → Add after express.json()
 *    - Needs authentication? → Add after jwtRotationAuth()
 *    - Needs user context? → Add after auditContextMiddleware()
 *    - Modifies response? → Add before error handler
 *    - Tracks performance? → Add early to measure full time
 *
 * 3. Add to server.js in correct location:
 *    const myFeatureMiddleware = require('./middleware/myFeature');
 *    app.use(myFeatureMiddleware);
 *
 * 4. Test middleware chain:
 *    - Standalone unit test for middleware function
 *    - Integration test with full app
 *    - Verify correct order by checking req properties
 *
 * Example: Middleware depends on authentication
 */

function exampleMiddlewareWithDependencies(req, res, next) {
  // Can assume these exist because of our middleware order:
  // - req.id (from correlationMiddleware)
  // - req.user (from jwtRotationAuth)
  // - req.apiVersion (from apiVersioningMiddleware)
  // - req.loaders (from batchLoaderMiddleware)

  if (!req.user) {
    // Only run for authenticated requests
    return next();
  }

  // Do something with authenticated user
  console.log(`User ${req.user.sub} made request to ${req.path}`);

  next();
}

/**
 * COMMON MISTAKES
 *
 * ❌ WRONG: Put error handler before routes
 *    The error handler won't catch errors from routes
 *
 * ✅ RIGHT: Put error handler AFTER all routes
 *
 * ❌ WRONG: Parse body before Stripe webhook middleware
 *    Stripe needs raw body, will fail to verify signature
 *
 * ✅ RIGHT: Handle Stripe webhook BEFORE express.json()
 *
 * ❌ WRONG: Call next() without awaiting async operations
 *    req.user won't be set when route handler runs
 *
 * ✅ RIGHT: Await async operations before calling next()
 *
 * ❌ WRONG: Cache response for authenticated endpoints
 *    User A sees User B's data
 *
 * ✅ RIGHT: Include user ID in cache key or disable cache for private data
 *
 * ❌ WRONG: Rate limit after auth
 *    Attackers can bypass limits by failing auth
 *
 * ✅ RIGHT: Rate limit before auth to protect authentication endpoint
 */

/**
 * TESTING MIDDLEWARE
 *
 * Unit test example:
 *
 *   describe('myFeatureMiddleware', () => {
 *     it('should add feature to request', () => {
 *       const req = { user: { sub: '123' } };
 *       const res = {};
 *       const next = jest.fn();
 *
 *       myFeatureMiddleware(req, res, next);
 *
 *       expect(req.myFeature).toBeDefined();
 *       expect(next).toHaveBeenCalled();
 *     });
 *   });
 *
 * Integration test example:
 *
 *   describe('middleware stack', () => {
 *     it('should apply all middleware in order', async () => {
 *       const res = await request(app)
 *         .get('/api/test')
 *         .expect(200);
 *
 *       expect(res.headers['x-request-id']).toBeDefined();
 *       expect(res.headers['x-powered-by']).toBeUndefined(); // removed by security
 *     });
 *   });
 */

module.exports = {
  setupMiddleware,
  exampleMiddlewareWithDependencies,
};
