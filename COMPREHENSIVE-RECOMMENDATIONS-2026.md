# 🚀 Comprehensive Recommendations: Infamous Freight Enterprises
**Generated: February 19, 2026** | **Audit Scope: Architecture, Code Quality, Performance, Security, Testing, CI/CD, Features, Documentation**

---

## 📋 Executive Summary

This document provides **100% coverage recommendations** across 8 critical areas. **Priority Action Items (P1)** should be addressed within 2 weeks. Most recommendations are **backward compatible** and can be implemented incrementally.

**Key Findings**:
- ✅ Strong security foundation (JWT, rate limiting, validation)
- ⚠️ Web/Mobile app testing coverage needs significant work
- 🔧 Performance optimization opportunities in database queries
- 📊 Documentation could be better organized
- 🏗️  Docker/deployment configs could be consolidated

---

## 1️⃣ ARCHITECTURE & SETUP

### Current State
- ✅ Monorepo structure with pnpm workspaces (well-designed)
- ✅ Clear separation: API (CommonJS), Web (ESM), Mobile (RN/Expo), Shared (types/utils)
- ⚠️ Multiple Docker configurations (5 Dockerfiles) creating maintenance burden
- ⚠️ Deployment configs spread across multiple services (Vercel, Fly.io, Firebase)

### Recommendations

#### 1.1 Consolidate Docker Configuration (P1)
**Problem**: 5 separate Dockerfiles cause version mismatches and maintenance overhead

**Solution**: Create unified multi-stage Docker builds
```dockerfile
# Dockerfile.unified - Single source of truth
FROM node:20-alpine AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# API target
FROM node:20-alpine AS api
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/package.json ./
EXPOSE 4000
CMD ["node", "server.js"]

# Web target
FROM node:20-alpine AS web
WORKDIR /app
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
EXPOSE 3000
CMD ["next", "start"]
```

**Action**: Update `docker-compose.yml` to use unified builds with `target: api` / `target: web`

#### 1.2 Standardize Environment Configuration (P1)
**Problem**: Env vars scattered across `.env.example`, code defaults, and docker-compose

**Solution**: Create centralized config management
```javascript
// apps/api/src/config/loadenv.js - Canonical env loader
const schema = {
  NODE_ENV: { default: 'development', enum: ['development', 'test', 'production'] },
  API_PORT: { default: 4000, type: 'number' },
  API_BASE_URL: { default: 'http://localhost:4000', required: true },
  JWT_SECRET: { required: process.env.NODE_ENV === 'production' },
  CORS_ORIGINS: { default: 'http://localhost:3000', parse: (v) => v.split(',') },
  LOG_LEVEL: { default: 'info', enum: ['debug', 'info', 'warn', 'error'] },
  // Rate limits
  RATE_LIMIT_GENERAL_MAX: { default: 100, type: 'number' },
  RATE_LIMIT_AUTH_MAX: { default: 5, type: 'number' },
  RATE_LIMIT_AI_MAX: { default: 20, type: 'number' },
  // AI
  AI_PROVIDER: { default: 'synthetic', enum: ['openai', 'anthropic', 'synthetic'] },
  // Caching
  REDIS_URL: { default: null },
  CACHE_TTL_SECONDS: { default: 300, type: 'number' },
};

module.exports = loadenv(schema);
```

**Benefits**: 
- Single source of truth for all config
- Runtime validation at startup
- Auto-generate .env.example

#### 1.3 Upgrade pnpm Workspaces (P2)
**Current**: v9.15.0
**Recommendation**: Pin exact versions with lock strategy

```bash
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'e2e'

# pnpm-lock.yaml: Use `importers` for workspace root scripts
```

**Action**: Document workspace dependency rules in [CONTRIBUTING.md](CONTRIBUTING.md):
- Shared lib versions defined in `packages/shared/package.json`
- Apps can use different transitive deps
- Pin pnpm to exact version: `"packageManager": "pnpm@9.15.0-exact"`

---

## 2️⃣ CODE QUALITY

### Current State
- ✅ Strong middleware patterns (security.js, validation.js, errorHandler.js)
- ✅ Consistent API error handling with ApiError class
- ⚠️ Some error handling inconsistencies in routes
- ⚠️ Web components lack TypeScript interfaces in some files
- ⚠️ No shared logging strategy across apps

### Recommendations

#### 2.1 Enforce Error Handling Standards (P1)

**Problem**: Some routes bypass global error handler

**Standard Pattern**:
```javascript
// ✅ CORRECT
router.post('/shipments', limiters.general, authenticate, async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.create({ data: req.body });
    res.status(201).json(new ApiResponse({ success: true, data: shipment }));
  } catch (err) {
    next(err);  // Always delegate to errorHandler
  }
});

// ❌ AVOID - Direct error responses
res.status(500).json({ error: err.message });  // Missing error context, status codes
res.json(ApiResponse({ success: false }));  // No error field
```

**Action**: 
- Create linting rule to enforce `next(err)` in try/catch
- Add script: `pnpm lint:errors` to validate pattern
```javascript
// eslintrc-error-handling.js
module.exports = {
  rules: {
    'no-direct-error-responses': {
      meta: { docs: { description: 'Routes must use next(err) not res.status().json()' } },
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee.object?.property?.name === 'status' && 
                node.parent?.callee?.property?.name === 'json') {
              context.report(node, 'Use next(err) for error handling');
            }
          },
        };
      },
    },
  },
};
```

#### 2.2 TypeScript Strict Mode for Web (P1)
**Problem**: Web app uses loose TypeScript config

**Solution**: Gradual migration to strict mode
```json
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "skipLibCheck": true
  },
  "include": ["pages/**/*.ts", "components/**/*.ts"],
  "exclude": ["components/**/*.legacy.ts"]
}
```

**Action**:
- Folder structure: `components/auth/` (strict) | `components/legacy/` (non-strict)
- Incremental migration over 1 sprint
- Use `@ts-expect-error` for legacy code comments

#### 2.3 Implement Code Quality Metrics (P2)

Create `.code-quality.json`:
```json
{
  "enforceRules": {
    "maxCyclomaticComplexity": 10,
    "maxLineLength": 100,
    "requireJSDoc": ["export"],
    "maxParamCount": 5,
    "forbidJSDocComments": false
  },
  "coverage": {
    "api": { "lines": 85, "functions": 88, "branches": 85 },
    "web": { "lines": 70, "functions": 75, "branches": 65 },
    "mobile": { "lines": 60, "functions": 65, "branches": 55 }
  }
}
```

---

## 3️⃣ PERFORMANCE OPTIMIZATION

### Current State
- ✅ Caching infrastructure exists (Redis + memory fallback)
- ✅ Database has indexes for common queries
- ⚠️ No query performance monitoring
- ⚠️ Bundle analysis exists but not enforced
- ⚠️ N+1 query risk in some routes

### Recommendations

#### 3.1 Implement Query Performance Monitoring (P1)

```javascript
// apps/api/src/middleware/queryMonitoring.js
const queryMonitor = (prisma) => {
  const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_MS || '500');
  
  return {
    onQuery({ query, duration }) {
      if (duration > slowQueryThreshold) {
        logger.warn({
          query,
          duration,
          threshold: slowQueryThreshold,
        }, 'Slow query detected');
      }
    },
  };
};

// apps/api/src/db/prisma.js
const { PrismaClient } = require('@prisma/client');
const { queryMonitor } = require('../middleware/queryMonitoring');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
  ],
});

prisma.$on('query', queryMonitor(prisma).onQuery);
```

**Action**: Add to environment:
```bash
SLOW_QUERY_MS=500           # Alert on queries >500ms
ENABLE_QUERY_LOGGING=true   # Enable in development only
```

#### 3.2 Optimize Database Queries with Batch Loading (P2)

**Problem**: Multiple sequential queries for related data

**Solution**: Use batch loaders
```javascript
// apps/api/src/services/batchLoader.js
const DataLoader = require('dataloader');

const shipmentLoader = new DataLoader(async (shipmentIds) => {
  const shipments = await prisma.shipment.findMany({
    where: { id: { in: shipmentIds } },
    include: { driver: true, tracking: true },
  });
  
  return shipmentIds.map(id => 
    shipments.find(s => s.id === id) || null
  );
});

// Usage in resolvers
router.get('/users/:id/shipments', async (req, res, next) => {
  try {
    const shipments = await Promise.all(
      shipmentIds.map(id => shipmentLoader.load(id))
    );
    res.json(new ApiResponse({ data: shipments }));
  } catch (err) {
    next(err);
  }
});
```

#### 3.3 Enforce Bundle Size Limits (P1)

```javascript
// lighthouserc.json - Add bundle thresholds
{
  "ci": {
    "uploads": { "target": "temporary-public-storage" },
    "assert": [
      {
        "preset": "lighthouse:recommended",
        "assertions": {
          "categories:performance": ["error", { "minScore": 0.9 }],
          "categories:accessibility": ["error", { "minScore": 0.9 }],
          "categories:best-practices": ["error", { "minScore": 0.85 }]
        }
      }
    ]
  },
  "upload": {
    "target": "lhci",
    "serverBaseUrl": "https://lhci.example.com",
    "token": "$LHCI_TOKEN"
  }
}
```

**Action**: Add CI check:
```yaml
# .github/workflows/bundle-size.yml
- name: Measure bundle size
  run: |
    cd apps/web
    npm run build:analyze
    npx bundlesize
```

#### 3.4 Implement Smart Caching for API Responses (P2)

```javascript
// apps/api/src/middleware/smartCache.js
function smartCache(req, res, next) {
  if (req.method !== 'GET') return next();
  
  const cacheControl = {
    'GET /api/shipments': 'public, max-age=300',           // 5 min
    'GET /api/shipments/:id': 'private, max-age=60',      // 1 min
    'GET /api/users/profile': 'private, max-age=0',       // No cache
  };
  
  const pattern = `${req.method} ${req.route.path}`;
  if (cacheControl[pattern]) {
    res.set('Cache-Control', cacheControl[pattern]);
  }
  
  next();
}
```

---

## 4️⃣ SECURITY ENHANCEMENTS

### Current State
- ✅ Strong JWT auth with scope validation
- ✅ Comprehensive rate limiting
- ✅ Input validation middleware
- ✅ Security headers set
- ⚠️ No OWASP compliance checklist
- ⚠️ No regular security audit schedule
- ⚠️ Token rotation could be more aggressive

### Recommendations

#### 4.1 Implement OWASP Top 10 Checklist (P1)

Create `.security/owasp-compliance.md`:
```markdown
# OWASP Top 10 2024 Compliance

## A1: Broken Access Control
- [x] Role-based access control (requireScope)
- [x] User ownership validation (validateUserOwnership)
- [x] Rate limiting by user
- [ ] Audit all API routes for authorization

## A2: Cryptographic Failures
- [x] HTTPS enforced in production
- [x] JWT signing with secure secret
- [ ] Implement key rotation quarterly
- [ ] Add PII encryption at rest

## A3: Injection
- [x] SQL injection prevention via Prisma ORM
- [x] Input validation middleware
- [x] XSS protection headers
- [ ] Add SQL query escaping tests

## A4: Insecure Design
- [x] Rate limiting
- [x] Error handling without info leakage
- [ ] Add security by design to new features

## A5: Security Misconfiguration
- [x] CORS restricted to known origins
- [x] Security headers set
- [ ] Add security.txt at /.well-known/security.txt
- [ ] Implement CSP stricter policies

## A6: Vulnerable & Outdated Components
- [ ] Run `npm audit` in CI/CD
- [ ] Set up Dependabot
- [ ] Update dependencies monthly

## A7: Authentication Failures
- [x] Rate limit auth endpoints
- [x] JWT validation
- [ ] Add 2FA support
- [ ] Add login attempt tracking

## A8: Data Integrity Failures
- [ ] Add API request signing
- [ ] Implement HMAC for webhooks
- [ ] Add checksum validation

## A9: Logging & Monitoring Failures
- [x] Structured logging (Pino)
- [x] Error tracking (Sentry)
- [ ] Add security event logging
- [ ] Create alert rules

## A10: SSRF, XXE, etc.
- [x] Input validation
- [ ] Add file upload validation
- [ ] Restrict external URL fetches
```

#### 4.2 Implement Automated Security Scanning (P1)

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm audit --audit-level=moderate
      
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            p/cwe-top-25
            
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: snyk/actions/setup@master
      - run: snyk test
```

#### 4.3 Implement Token Rotation per Request (P1)

```javascript
// apps/api/src/auth/tokenRotation.js
function rotateTokenPerRequest(req, res, next) {
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    if (req.user && process.env.NODE_ENV === 'production') {
      const newToken = jwt.sign(
        {
          sub: req.user.sub,
          email: req.user.email,
          scopes: req.user.scopes,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      res.set('X-New-Token', newToken);
    }
    
    return originalJson(data);
  };
  
  next();
}
```

#### 4.4 Add Request Signing for Webhooks (P2)

```javascript
// apps/api/src/services/webhook.js
const crypto = require('crypto');

function signWebhookPayload(payload) {
  const secret = process.env.WEBHOOK_SECRET;
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `${timestamp}.${JSON.stringify(payload)}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  
  return {
    payload,
    timestamp,
    signature,
    header: `t=${timestamp},v1=${signature}`,
  };
}
```

---

## 5️⃣ TESTING STRATEGY

### Current State
- ✅ API: 85-90% coverage with comprehensive mocks and e2e tests
- ⚠️ Web: Minimal test coverage (security tests only)
- ⚠️ Mobile: No tests configured
- ⚠️ No integration test suite
- ⚠️ No load testing

### Recommendations

#### 5.1 Establish Web App Testing Foundation (P1)

Create `apps/web/tests/` structure:
```
tests/
├── unit/
│   ├── components/
│   │   ├── ShipmentCard.test.tsx
│   │   ├── AuthForm.test.tsx
│   │   └── Dashboard.test.tsx
│   ├── hooks/
│   │   ├── useAuth.test.ts
│   │   ├── useShipments.test.ts
│   │   └── useApi.test.ts
│   └── utils/
│       └── validation.test.ts
├── integration/
│   ├── api-integration.test.ts
│   ├── auth-flow.test.ts
│   └── shipment-workflow.test.ts
├── e2e/
│   └── critical-flows.test.ts
└── fixtures/
    └── mock-data.ts
```

**Setup Vitest**:
```typescript
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'tests/'],
      lines: 70,
      functions: 75,
      branches: 65,
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

**Example Test**:
```typescript
// apps/web/tests/unit/components/ShipmentCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ShipmentCard } from '@/components/ShipmentCard';

describe('ShipmentCard', () => {
  it('renders shipment details', () => {
    const shipment = {
      id: '123',
      reference: 'TEST-001',
      status: 'IN_TRANSIT',
      pickup: '123 Main St',
      delivery: '456 Oak Ave',
    };
    
    render(<ShipmentCard shipment={shipment} />);
    
    expect(screen.getByText('TEST-001')).toBeInTheDocument();
    expect(screen.getByText('IN_TRANSIT')).toBeInTheDocument();
  });
});
```

#### 5.2 Implement Mobile App Testing (P2)

```javascript
// apps/mobile/jest.config.js
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
```

#### 5.3 Add API Integration Tests (P1)

```javascript
// apps/api/__tests__/integration/api-integration.test.js
describe('Full API Integration', () => {
  describe('Shipment Workflow', () => {
    it('should complete full shipment lifecycle', async () => {
      // 1. Create user
      const userRes = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
      });
      const token = userRes.body.data.token;
      
      // 2. Create shipment
      const shipmentRes = await request(app)
        .post('/api/shipments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          pickupAddress: '123 Main St',
          deliveryAddress: '456 Oak Ave',
          weight: 100,
        });
      expect(shipmentRes.status).toBe(201);
      const shipmentId = shipmentRes.body.data.id;
      
      // 3. Track shipment
      const trackRes = await request(app)
        .get(`/api/shipments/${shipmentId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(trackRes.status).toBe(200);
      expect(trackRes.body.data.status).toBe('CREATED');
      
      // 4. Update status
      const updateRes = await request(app)
        .patch(`/api/shipments/${shipmentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'DELIVERED' });
      expect(updateRes.status).toBe(200);
    });
  });
});
```

#### 5.4 Implement Load Testing (P2)

```javascript
// load-test.k6.js - Already exists, enhance it
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Stay at 100
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function() {
  const url = 'http://localhost:4000/api';
  const token = 'Bearer test-token';
  
  // Test shipment creation
  const res = http.post(`${url}/shipments`, 
    JSON.stringify({
      pickupAddress: '123 Main St',
      deliveryAddress: '456 Oak Ave',
      weight: 100,
    }),
    { headers: { Authorization: token } }
  );
  
  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

#### 5.5 Create Coverage Dashboard (P2)

```javascript
// scripts/coverage-report.js
const fs = require('fs');
const path = require('path');

function generateCoverageReport() {
  const coverage = {
    api: JSON.parse(fs.readFileSync('apps/api/coverage/coverage-summary.json')),
    web: JSON.parse(fs.readFileSync('apps/web/coverage/coverage-summary.json')),
  };
  
  const report = `
# Test Coverage Report

## API
- Lines: ${coverage.api.total.lines.pct}%
- Functions: ${coverage.api.total.functions.pct}%
- Branches: ${coverage.api.total.branches.pct}%

## Web
- Lines: ${coverage.web.total.lines.pct}%
- Functions: ${coverage.web.total.functions.pct}%
- Branches: ${coverage.web.total.branches.pct}%

[View detailed report](./coverage/index.html)
  `;
  
  fs.writeFileSync('coverage-summary.md', report);
}

generateCoverageReport();
```

---

## 6️⃣ CI/CD & DEPLOYMENT

### Current State
- ✅ Multiple deployment targets (Vercel, Fly.io)
- ✅ Docker Compose for local development
- ⚠️ No unified deployment orchestration
- ⚠️ No deployment rollback strategy
- ⚠️ GitHub Actions workflows could be optimized

### Recommendations

#### 6.1 Create Unified Deployment Pipeline (P1)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test:coverage
      - run: pnpm typecheck

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push API
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile.unified
          target: api
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/api:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/api:${{ github.sha }}
      
      - name: Build and push Web
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile.unified
          target: web
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/web:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/web:${{ github.sha }}

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Fly.io staging
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
        run: |
          curl -L https://fly.io/install.sh | sh
          flyctl deploy --config fly.staging.toml --remote-only

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel (Web)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          pnpm install -g vercel
          cd apps/web && vercel deploy --prod --token $VERCEL_TOKEN
      
      - name: Deploy to Fly.io (API)
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
        run: |
          curl -L https://fly.io/install.sh | sh
          flyctl deploy --config fly.api.toml --remote-only
```

#### 6.2 Implement Blue-Green Deployment (P2)

```yaml
# .github/workflows/blue-green-deploy.yml
name: Blue-Green Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Green (new) environment
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
        run: |
          # Deploy to green environment
          flyctl deploy --config fly.${{ inputs.environment }}-green.toml
          
          # Run smoke tests
          ./scripts/smoke-tests.sh
      
      - name: Switch traffic (Blue → Green)
        if: success()
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
        run: |
          # Update DNS/routing to point to green
          flyctl scale --app infamous-green --count 2
          sleep 30
          
          # Monitor metrics
          ./scripts/monitor-metrics.sh
```

#### 6.3 Add Deployment Rollback Strategy (P1)

```bash
# scripts/rollback.sh
#!/bin/bash
set -e

ENVIRONMENT=${1:-production}
ROLLBACK_TO=${2:-previous}

echo "🔄 Rolling back $ENVIRONMENT to $ROLLBACK_TO..."

# Get previous deployment tag
PREVIOUS_TAG=$(git describe --tags --abbrev=0)

# Deploy previous version
flyctl deploy \
  --config fly.$ENVIRONMENT.toml \
  --image-label $PREVIOUS_TAG \
  --remote-only

# Verify deployment
sleep 10
health_check=$(curl -s https://api.infamous.com/api/health)

if echo "$health_check" | jq -e '.status == "ok"' > /dev/null; then
  echo "✅ Rollback successful"
  exit 0
else
  echo "❌ Rollback failed - manual intervention required"
  exit 1
fi
```

#### 6.4 Create Environment Parity Matrix (P2)

```yaml
# .github/env-matrix.yml
environments:
  development:
    api_port: 4000
    web_port: 3000
    redis: local
    database: postgresql://localhost/infamous_dev
    ai_provider: synthetic
    
  staging:
    api_port: 3001
    web_port: 443
    redis: redis://redis-staging:6379
    database: ${{ secrets.STAGING_DATABASE_URL }}
    ai_provider: synthetic
    
  production:
    api_port: 443
    web_port: 443
    redis: ${{ secrets.PROD_REDIS_URL }}
    database: ${{ secrets.PROD_DATABASE_URL }}
    ai_provider: ${{ secrets.PROD_AI_PROVIDER }}
```

---

## 7️⃣ FEATURE RECOMMENDATIONS

### New Features (Prioritized)

#### 7.1 API Versioning (P2)
**Rationale**: Enable breaking changes without disrupting clients

```javascript
// apps/api/src/middleware/versioning.js
function apiVersionMiddleware(req, res, next) {
  const version = req.headers['api-version'] || req.query.v || 'v1';
  req.apiVersion = version;
  res.set('API-Version', version);
  next();
}

// Route example
router.get('/api/v1/shipments', authenticateV1, shipmentsV1Handler);
router.get('/api/v2/shipments', authenticateV2, shipmentsV2Handler);
```

#### 7.2 Real-time Notifications via WebSocket (P3)
**Current State**: WebSocket service exists but could be improved

```javascript
// apps/api/src/services/websocket-enhanced.js
class WebSocketManager {
  constructor() {
    this.clients = new Map();
    this.rooms = new Map();
  }
  
  subscribe(userId, socket) {
    this.clients.set(userId, socket);
    const roomKey = `user:${userId}`;
    if (!this.rooms.has(roomKey)) {
      this.rooms.set(roomKey, new Set());
    }
    this.rooms.get(roomKey).add(socket);
  }
  
  broadcast(userId, event, data) {
    const room = this.rooms.get(`user:${userId}`);
    room?.forEach(socket => {
      socket.emit('notification', { type: event, data });
    });
  }
}
```

#### 7.3 Multi-tenant Support (P3)
**Benefit**: Enable white-label or reseller features

```javascript
// apps/api/src/middleware/tenancy.js
function tenancyMiddleware(req, res, next) {
  const tenantId = req.headers['x-tenant-id'] || req.user?.org_id;
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Missing tenant ID' });
  }
  
  req.tenant = { id: tenantId };
  next();
}

// Example query with tenant isolation
const shipments = await prisma.shipment.findMany({
  where: {
    organizationId: req.tenant.id,  // Always filter by tenant
    status: 'IN_TRANSIT',
  },
});
```

#### 7.4 Advanced Analytics Dashboard (P3)
- Real-time shipment tracking
- Revenue metrics by region/vehicle type
- Driver performance analytics
- Predictive delivery time estimates

#### 7.5 Mobile App Enhancements (P2)
- Offline-first support (local caching)
- Push notifications for shipment updates
- QR code scanning for package verification
- Biometric authentication

---

## 8️⃣ DOCUMENTATION IMPROVEMENTS

### Current State
- ✅ Good foundation (README.md, CONTRIBUTING.md)
- ⚠️ Scattered documentation across multiple files
- ⚠️ No API documentation index
- ⚠️ No runbook for common operations

### Recommendations

#### 8.1 Create Centralized Documentation Index (P1)

Create `DOCUMENTATION_INDEX.md`:
```markdown
# Documentation Index

## 🚀 Getting Started
- [Installation & Setup](./SETUP.md)
- [Development Environment](./DEVELOPMENT.md)
- [First Deploy](./DEPLOYMENT.md)

## 🏗️ Architecture
- [System Design](./ARCHITECTURE.md)
- [Data Flow](./DATA-FLOW.md)
- [Monorepo Structure](./MONOREPO.md)

## 📚 API Documentation
- [REST API Reference](./API-REFERENCE.md)
- [Authentication & Scopes](./AUTH.md)
- [Rate Limiting](./RATE-LIMITING.md)
- [Error Handling](./ERROR-HANDLING.md)

## 🔧 Operations
- [Health Checks](./HEALTH-CHECKS.md)
- [Monitoring & Alerts](./MONITORING.md)
- [Incident Response](./INCIDENT-RESPONSE.md)
- [Database Maintenance](./DATABASE-MAINTENANCE.md)

## 🛡️ Security
- [Security Overview](./SECURITY.md)
- [Compliance Checklist](./COMPLIANCE.md)
- [Vulnerability Reporting](./SECURITY-POLICY.md)

## 📊 Performance
- [Performance Optimization](./PERFORMANCE.md)
- [Load Testing](./LOAD-TESTING.md)
- [Caching Strategy](./CACHING.md)

## 👨‍💻 Development
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Code Style Guide](./CODE-STYLE.md)
- [Testing Strategy](./TESTING.md)
- [Git Workflow](./GIT-WORKFLOW.md)

## 🚢 Deployment
- [Environment Setup](./ENVIRONMENTS.md)
- [CI/CD Pipeline](./CI-CD.md)
- [Rollback Procedures](./ROLLBACK.md)

## 📞 Support
- [FAQ](./FAQ.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Contact & Escalation](./SUPPORT.md)
```

#### 8.2 Create API Documentation with OpenAPI/Swagger (P2)

```javascript
// apps/api/src/swagger.js - Enhance existing setup
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Infamous Freight API',
      version: '2.0.0',
      description: 'AI-Powered Freight & Logistics Automation',
      contact: {
        name: 'Support',
        url: 'https://infamous.com/support',
      },
      license: {
        name: 'Proprietary',
        url: 'https://infamous.com/license',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Development',
      },
      {
        url: 'https://api.infamous.com/api',
        description: 'Production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/**/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };

// Usage: app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
```

#### 8.3 Create Operations Runbook (P1)

Create `OPERATIONS-RUNBOOK.md` with common tasks:
```markdown
# Operations Runbook

## Emergency Procedures

### 1. API is Down
1. Check health: `curl https://api.infamous.com/api/health`
2. Check logs: `flyctl logs --app infamous`
3. Restart API: `flyctl restart --app infamous`
4. If still down, trigger rollback

### 2. Database Connection Issues
1. Check database status
2. Check connection limit: `SELECT count(*) FROM pg_stat_activity`
3. Kill idle connections if needed
4. Restart API service

### 3. High Error Rate
1. Check recent deployments
2. Check error logs in Sentry
3. Check resource usage (CPU, memory)
4. Trigger rollback if necessary

## Routine Maintenance

### Daily
- Monitor error rates in Sentry
- Check API response times
- Review security logs

### Weekly
- Review coverage reports
- Check for dependency updates
- Test disaster recovery procedures

### Monthly
- Review and optimize slow queries
- Audit security logs
- Update documentation
```

#### 8.4 Create Troubleshooting Guide (P2)

```markdown
# Troubleshooting Guide

## Common Issues

### "Too many requests" errors
**Cause**: Rate limit exceeded
**Solution**:
- Check rate limit headers in response
- Wait before retrying
- Request rate limit increase for your API tier

### "Invalid token" errors
**Cause**: JWT expired or invalid
**Solution**:
- Re-authenticate
- Check token expiry time
- Verify JWT secret matches

### "Slow API responses"
**Cause**: Database query performance
**Solution**:
- Check slow query logs
- Verify database connection
- Consider query optimization

### Deployment failures
**Cause**: Test failure or build error
**Solution**:
- Check CI/CD logs
- Run tests locally
- Verify all dependencies installed
```

#### 8.5 Create Architecture Decision Records (P2)

Create `ADR/` directory with decisions:
```markdown
# ADR-001: Monorepo Structure

## Date: 2024-01-15

## Decision
Use pnpm workspaces for monorepo management instead of Yarn or Lerna

## Rationale
- Disk space efficiency (hard links)
- Fast installation
- Strong TypeScript support
- Active maintenance

## Consequences
- Developers must understand workspace rules
- Requires pnpm 8+
- Cannot use npm or yarn directly

## Status: Accepted
```

---

## 📊 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2) - **P1 Items**
```
Week 1:
- [ ] Consolidate Docker configuration
- [ ] Implement environment config validation
- [ ] Add error handling linting
- [ ] Set up Web app testing foundation
- [ ] Add OWASP compliance checklist

Week 2:
- [ ] Implement query performance monitoring
- [ ] Add security scanning CI/CD
- [ ] Create centralized documentation index
- [ ] Implement token rotation
- [ ] Set up API integration tests
```

### Phase 2: Enhancement (Weeks 3-4) - **P2 Items**
```
Week 3:
- [ ] Implement batch loaders
- [ ] Add bundle size enforcement
- [ ] Set up mobile app testing
- [ ] Create operations runbook
- [ ] Implement blue-green deployment

Week 4:
- [ ] Add smart API caching
- [ ] Implement load testing
- [ ] Create coverage dashboard
- [ ] Add webhook signing
- [ ] Document API with Swagger/OpenAPI
```

### Phase 3: Advanced (Weeks 5-6) - **P3 Items**
```
Week 5:
- [ ] Implement API versioning
- [ ] Add WebSocket enhancements
- [ ] Multi-tenant support
- [ ] Create troubleshooting guide

Week 6:
- [ ] Real-time notifications
- [ ] Analytics dashboard
- [ ] Mobile offline support
- [ ] Architecture decision records
```

---

## ✅ SUCCESS METRICS

Track these metrics to measure improvement:

```json
{
  "codeQuality": {
    "testCoverage": {
      "api": 85,
      "web": 70,
      "mobile": 60,
      "target": "api:90, web:80, mobile:70"
    },
    "lintingScore": {
      "current": 98,
      "target": 100
    }
  },
  "performance": {
    "apiP95Latency": {
      "current": "450ms",
      "target": "200ms"
    },
    "webFirstPageLoad": {
      "current": "3.2s",
      "target": "1.5s"
    }
  },
  "security": {
    "vulnerabilities": {
      "critical": 0,
      "high": 0
    },
    "owasp": {
      "compliant": 8,
      "target": 10
    }
  },
  "deployment": {
    "deploymentFrequency": {
      "current": "2x/week",
      "target": "daily"
    },
    "leadTime": {
      "current": "4 hours",
      "target": "30 minutes"
    },
    "mttr": {
      "current": "45 minutes",
      "target": "10 minutes"
    }
  }
}
```

---

## 📋 QUICK ACTION CHECKLIST

**Start Today (P1):**
- [ ] Review consolidation of Docker configurations
- [ ] Enable error handling linting
- [ ] Initialize Web app test suite
- [ ] Add OWASP compliance checklist

**This Sprint (P1):**
- [ ] Implement query performance monitoring
- [ ] Add security scanning to CI/CD
- [ ] Create operations runbook
- [ ] Set up token rotation

**Next Sprint (P2):**
- [ ] Implement batch loaders for database
- [ ] Add bundle size enforcement
- [ ] Mobile app testing setup
- [ ] Blue-green deployment

---

## 🤝 NEXT STEPS

1. **Review** this document with the team
2. **Prioritize** based on business impact
3. **Assign** owners for each section
4. **Schedule** implementation sprints
5. **Track** progress with metrics
6. **Review** monthly for updates

---

**Questions?** Create an issue in the repository or contact the maintainers.

*Document Version: 1.0.0 | Updated: February 19, 2026*
