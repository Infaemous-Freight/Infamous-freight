# GitHub Copilot Instructions for Infamous Freight Enterprises

## 🏗️ Architecture Overview

**Monorepo Structure** (pnpm workspaces @ 8.15.9):

- `api/` - Express.js backend (port 4000 default via `API_PORT`), **CommonJS** via `require()`
- `web/` - Next.js 14 frontend (port 3000 default via `WEB_PORT`), **TypeScript/ESM** via `import`
- `mobile/` - React Native/Expo app (TypeScript)
- `packages/shared/` - TypeScript package with shared types, constants, utilities (`@infamous-freight/shared`)
- `e2e/` - Playwright end-to-end tests

**Note**: Docker Compose maps API internally to port 3001 by default (override with `API_PORT` env var)

**Data Flow**: API ↔ PostgreSQL (Prisma ORM) | Web/Mobile ↔ API (REST + scope-based auth)

**Critical**: Shared package exports domain types, constants, and utils that **MUST be imported from `@infamous-freight/shared`** everywhere — never redefine. The shared package must be **built before API startup** when types change: `pnpm --filter @infamous-freight/shared build`

## 🔌 Service Communication Patterns

### API Architecture (Express.js + CommonJS)

**Routes** (`api/src/routes/`):

- `health.js` - Liveness/readiness probes
- `ai.commands.js` - AI inference with scope-based auth + rate limiting
- `voice.js` - Audio ingest & text commands, Multer file upload
- `billing.js` - Stripe/PayPal integration
- `shipments.js`, `users.js` - CRUD with Prisma

**Middleware Stack** (`api/src/middleware/`):

- **security.js** - JWT auth, `authenticate()` + `requireScope()`, per-endpoint rate limiters
  - Exports: `limiters` (general, auth, billing, ai), `authenticate`, `requireScope`, `auditLog`
  - Rate limits: general 100/15min, auth 5/15min, ai 20/1min, billing 30/15min
  - Maintains set of allowed JWT scopes per route
- **validation.js** - `validateString()` + `handleValidationErrors()` via express-validator
  - Reusable validators: `validateEmail()`, `validatePhone()`, `validateUUID()`
  - Always pair with `handleValidationErrors` to catch and format violations
- **errorHandler.js** - Global error catch-all, converts errors to HTTP status codes

  # GitHub Copilot Instructions (Infamous Freight Enterprises)

  ## Overview

  - Monorepo with pnpm workspaces: `api` (Express/CommonJS), `web` (Next.js 14/TypeScript ESM), `mobile` (Expo RN), `packages/shared` (TypeScript shared lib), `e2e` (Playwright).
  - Data flow: Web/Mobile → API (REST, JWT scopes) → PostgreSQL via Prisma.
  - Critical rule: Import domain types/constants/utils from `@infamous-freight/shared` everywhere. Never redefine. Rebuild shared after changes.

- Quick checklist when editing shared:
  - Update `packages/shared/src/*.ts`
  - Rebuild: `pnpm --filter @infamous-freight/shared build`
  - Restart services: `pnpm dev` (or `pnpm api:dev`/`pnpm web:dev`)

## Must-Know Patterns

- API route order: `limiters → authenticate → requireScope → auditLog → validators → handleValidationErrors → handler → next(err)`.
- Responses: Use `ApiResponse` and `HTTP_STATUS` from shared; delegate errors with `next(err)` to global `errorHandler`.
- Auth: Scopes enforced per-route (e.g., `requireScope("ai:command")`). Rate limits: general 100/15m, auth 5/15m, ai 20/1m, billing 30/15m.
- Shared build required when `packages/shared/src/{types.ts,constants.ts,utils.ts,env.ts}` change.

## Developer Workflow

- Start dev: `pnpm dev` (all), `pnpm api:dev` (API on 3001 in Docker), `pnpm web:dev` (Web 3000).
- Tests: `pnpm test`, coverage HTML in `api/coverage/`. API coverage thresholds enforced in CI (≈75–84%).
- Lint/format: `pnpm lint && pnpm format`. Type check: `pnpm check:types`.
- Prisma: edit `api/prisma/schema.prisma` → `cd api && pnpm prisma:migrate:dev --name <change>` → optional `pnpm prisma:studio` → `pnpm prisma:generate`.
- Codex CLI: AI coding agent available in devcontainer. Run `codex` for interactive mode, or use keyboard shortcut `Ctrl+Shift+C` in VS Code. See [QUICK_REFERENCE.md](QUICK_REFERENCE.md#codex-cli).

## File/Dir References

- API routes: `api/src/routes/` (e.g., `health.js`, `shipments.js`, `ai.commands.js`, `voice.js`, `billing.js`).
- Middleware: `api/src/middleware/` ([security.js](../api/src/middleware/security.js), [validation.js](../api/src/middleware/validation.js), `errorHandler.js`, `logger.js`, `securityHeaders.js`).
- Services: `api/src/services/` (e.g., `aiSyntheticClient.js` with OpenAI/Anthropic/synthetic modes).
- Shared: `packages/shared/src/` (`types.ts`, `constants.ts`, `utils.ts`, `env.ts`). Build outputs to `packages/shared/dist/`.
- Web: `web/pages/`, `web/components/`. Use `ApiResponse<T>` and `SHIPMENT_STATUSES` from shared.

## Examples

- API handler:

  ```js
  router.post(
    "/action",
    limiters.general, // see limiters preset: [security.js](../api/src/middleware/security.js#L32)
    authenticate, // [authenticate()](../api/src/middleware/security.js#L69)
    requireScope("scope:name"), // [requireScope()](../api/src/middleware/security.js#L89)
    auditLog,
    [validateString("field"), handleValidationErrors], // [handleValidationErrors](../api/src/middleware/validation.js#L6)
    async (req, res, next) => {
      try {
        const result = await service.doAction(req.body);
        res
          .status(HTTP_STATUS.OK)
          .json(new ApiResponse({ success: true, data: result }));
      } catch (err) {
        next(err);
      }
    },
  );
  ```

- Web SSR fetch:

  ```ts
  const r = await fetch(`${process.env.API_BASE_URL}/api/shipments/1`);
  const result: ApiResponse<Shipment> = await r.json();
  if (!result.success || !result.data) return { notFound: true };
  return { props: { shipment: result.data } };
  ```

- Helpful deep links:
  - Limiters preset: [security.js](../api/src/middleware/security.js#L32)
  - `authenticate()`: [security.js](../api/src/middleware/security.js#L69)
  - `requireScope()`: [security.js](../api/src/middleware/security.js#L89)
  - `auditLog`: [security.js](../api/src/middleware/security.js#L104)
  - `handleValidationErrors`: [validation.js](../api/src/middleware/validation.js#L6)
  - Real route demonstrating order: [ai.commands.js](../api/src/routes/ai.commands.js#L17-L38)
  - Logger performance levels: [logger.js](../api/src/middleware/logger.js#L90-L94)
  - Billing route rate-limited: [billing.js](../api/src/routes/billing.js#L38-L68)

## Integration & Config

- AI: `api/src/services/aiSyntheticClient.js` selected via `AI_PROVIDER` (`openai|anthropic|synthetic`); uses retry; synthetic fallback when keys missing.
- Billing: Stripe/PayPal under `api/src/routes/billing.js` with dedicated rate limits.
- Voice: `api/src/routes/voice.js` using Multer (size via `VOICE_MAX_FILE_SIZE_MB`), scopes `voice:ingest`/`voice:command`.
- Security: JWT via [security.js](../api/src/middleware/security.js), CORS via `CORS_ORIGINS` (see [.env.example](../.env.example#L24)), Helmet headers via `securityHeaders.js`, Sentry in server and `errorHandler.js`. Error responses handled centrally in [errorHandler.js](../api/src/middleware/errorHandler.js#L22).
- Web performance: Vercel Analytics and Speed Insights wired in [web/pages/\_app.tsx](../web/pages/_app.tsx). `SpeedInsights` renders in production. Datadog RUM initialized when `NEXT_PUBLIC_ENV=production` with `NEXT_PUBLIC_DD_APP_ID`, `NEXT_PUBLIC_DD_CLIENT_TOKEN`, `NEXT_PUBLIC_DD_SITE` (see [.env.example](../.env.example#L36-L40)).
  - JWT: [security.js](../api/src/middleware/security.js)
  - CORS: configure `CORS_ORIGINS` (see [.env.example](../.env.example#L24))
  - Voice upload size: `VOICE_MAX_FILE_SIZE_MB` default `10` (see [.env.example](../.env.example#L42) and [voice.js](../api/src/routes/voice.js#L14))

## Gotchas

- Shared changes require: `pnpm --filter @infamous-freight/shared build` then restart services.
- API in Docker maps to 3001; standalone defaults to 4000 (`API_PORT`, see [.env.example](../.env.example#L5)); Web defaults to 3000 (see [.env.example](../.env.example#L10)).
  - Defaults: `API_PORT=4000` (see [.env.example](../.env.example#L5)), `WEB_PORT=3000` (see [.env.example](../.env.example#L10)).
- Always use shared enums (e.g., `SHIPMENT_STATUSES`) instead of string literals.
- Jest tests assume `process.env.JWT_SECRET = "test-secret"` and mock external services.

## Quick Commands

- Build shared: `pnpm --filter @infamous-freight/shared build`
- Run API tests only: `pnpm --filter api test`
- Prisma generate: `cd api && pnpm prisma:generate`
- Kill ports: `lsof -ti:3001 | xargs kill -9` (API), `lsof -ti:3000 | xargs kill -9` (Web)
- Env defaults: `AI_PROVIDER=synthetic` (see [.env.example](../.env.example#L27)), `VOICE_MAX_FILE_SIZE_MB=10` (see [.env.example](../.env.example#L42))
- Env defaults: `AI_PROVIDER=synthetic` (see [.env.example](../.env.example#L27))
- Production: Web deployed to <https://infamous-freight-enterprises-git-f34b9b-santorio-miles-projects.vercel.app> (Vercel)

---

Feedback welcome: Are any middleware names, rate limits, or env defaults unclear or out of date? I can refine sections with exact file links or add missing examples.

```javascript
// api/src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Log error to console
  logger.error("Request failed", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Send to Sentry
  Sentry.captureException(err, {
    tags: {
      path: req.path,
      method: req.method,
    },
    user: req.user ? { id: req.user.sub } : undefined,
  });

  // Return to client
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
};
```

**Custom Context**:

```javascript
// Add custom context to errors
Sentry.setContext("shipment", {
  id: shipment.id,
  status: shipment.status,
  driver: shipment.driverId,
});

// Set user context for better tracking
Sentry.setUser({
  id: req.user.sub,
  email: req.user.email,
  role: req.user.role,
});
```

### Logging Strategy

**Structured Logging** (`api/src/middleware/logger.js`):

```javascript
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Log HTTP requests
logger.info("Shipment created", {
  shipmentId: shipment.id,
  userId: req.user.sub,
  duration: Date.now() - req.startTime,
});
```

**Log Levels**:

- `error` - Application errors, exceptions (goes to Sentry)
- `warn` - Degraded functionality, rate limits hit
- `info` - Business events (shipment created, user logged in)
- `debug` - Diagnostic info (only in development)

### Health Checks

**Endpoint**: `GET /api/health`

```javascript
// api/src/routes/health.js
router.get("/health", async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: "ok",
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = "connected";
  } catch (err) {
    health.database = "disconnected";
    health.status = "degraded";
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});
```

**Monitoring with Health Checks**:

- Uptime monitoring: Ping `/api/health` every 60s
- Alerting: Trigger on 503 status or 3 consecutive failures
- Dashboard: Display uptime, response times, error rates

## ⚡ Performance Optimization

### Bundle Analysis

**Next.js Bundle Analyzer** (`web/next.config.mjs`):

```javascript
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer({
  reactStrictMode: true,
  swcMinify: true, // Fast minification
  compress: true, // GZIP compression
});
```

**Run Bundle Analysis**:

```bash
cd web
ANALYZE=true pnpm build
# Opens browser with interactive bundle visualization
```

**Optimization Targets**:

- First Load JS < 150KB
- Total bundle size < 500KB
- Code splitting for routes
- Dynamic imports for heavy components

### Code Splitting Pattern

```typescript
// web/pages/dashboard.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy chart component
const ShipmentChart = dynamic(() => import('../components/ShipmentChart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false,  // Disable SSR for client-only component
});

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <ShipmentChart />
    </div>
  );
}
```

### API Performance

**Database Query Optimization**:

```javascript
// ❌ BAD: N+1 query problem
const shipments = await prisma.shipment.findMany();
for (const shipment of shipments) {
  shipment.driver = await prisma.driver.findUnique({
    where: { id: shipment.driverId },
  });
}

// ✅ GOOD: Use include to fetch related data
const shipments = await prisma.shipment.findMany({
  include: { driver: true },
});
```

**Response Caching**:

```javascript
// Cache frequently accessed data
const cache = new Map();

router.get("/shipments/:id", async (req, res) => {
  const cacheKey = `shipment:${req.params.id}`;

  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id: req.params.id },
  });
  cache.set(cacheKey, shipment);

  // Expire cache after 5 minutes
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);

  res.json(shipment);
});
```

**Rate Limiting by Complexity**:

```javascript
// More aggressive rate limiting for expensive operations
const complexLimiters = {
  reports: createLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10/15min
  exports: createLimiter({ windowMs: 60 * 60 * 1000, max: 5 }), // 5/hour
};

router.get("/reports/analytics", complexLimiters.reports, async (req, res) => {
  // Heavy database aggregation
});
```

### Performance Monitoring

**Metrics to Track**:

1. **API Response Time**: P50, P95, P99 latencies
2. **Database Query Time**: Slow query log (>1s)
3. **Error Rate**: 5xx errors / total requests
4. **Web Vitals**: LCP (<2.5s), FID (<100ms), CLS (<0.1)

**Lighthouse CI**:

```bash
# Run Lighthouse audit
cd web
pnpm build
pnpm start &
npx lighthouse http://localhost:3000 --view
```

**Performance Budgets** (enforce in CI):

```javascript
// .github/workflows/performance.yml
- name: Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun --config=lighthouserc.json
```

## �📖 Additional Resources

- [README.md](README.md) - Project overview & architecture
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command cheat sheet
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - All documentation
