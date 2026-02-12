# 🚀 Quick Fix Checklist - Audit Findings

**Priority Actions from Repository Audit**

## ⚡ Immediate Fixes (< 1 hour)

### 1. Update Vulnerable Dependencies

```bash
cd /workspaces/Infamous-freight-enterprises

# Fix axios vulnerability (High severity)
pnpm update axios --recursive

# Fix esbuild vulnerability (Moderate severity)  
pnpm update esbuild --recursive

# Fix brace-expansion (via next-pwa)
cd apps/web
pnpm update next-pwa

# Run full audit fix
cd ../..
pnpm audit fix

# Verify fixes
pnpm audit --audit-level=moderate
```

**Expected Result:** 4 vulnerabilities → 0 vulnerabilities

---

### 2. Fix TypeScript Configuration

**File:** `packages/shared/tsconfig.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Test:**
```bash
cd packages/shared
pnpm build
# Should complete without errors
```

---

### 3. Fix Next.js Lint Configuration

**File:** `apps/web/package.json`

Change:
```json
"lint": "next lint"
```

To:
```json
"lint": "next lint ."
```

**Test:**
```bash
cd apps/web
pnpm lint
# Should run without directory errors
```

---

## 🔧 Short-term Fixes (2-4 hours)

### 4. Replace Console.log with Structured Logging

**Create logger utility:** `apps/api/src/utils/logger.js`

```javascript
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

module.exports = logger;
```

**Replace in files:**

Priority files to update:
1. `apps/api/database.js` (5 instances)
2. `apps/api/src/billing/stripeSync.ts` (12 instances)
3. `apps/api/src/billing/invoicing.ts` (10 instances)
4. `apps/mobile/services/*.ts` (8 instances)

Example replacement:
```javascript
// ❌ Before
console.log('✅ Loaded', this.shipments.length, 'shipments');

// ✅ After
logger.info('Database loaded', { 
  shipmentCount: this.shipments.length 
});
```

---

### 5. Sanitize innerHTML Usage

**Install DOMPurify:**
```bash
cd apps/api
pnpm add dompurify
pnpm add -D @types/dompurify
```

**Update:** `apps/api/src/routes/health-detailed.js` (Lines 297, 299)

```javascript
const DOMPurify = require('dompurify');

// Before
document.getElementById('health').innerHTML = html;

// After
document.getElementById('health').innerHTML = DOMPurify.sanitize(html);
```

---

### 6. Add Environment Variable Validation

**Create:** `apps/api/src/config/env.validation.js`

```javascript
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.string().transform(Number).default('4000'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(result.error.format());
    process.exit(1);
  }
  
  return result.data;
}

module.exports = { validateEnv };
```

**Use in:** `apps/api/src/server.js`

```javascript
const { validateEnv } = require('./config/env.validation');
const env = validateEnv();
// Now use `env.API_PORT` instead of `process.env.API_PORT`
```

---

## 📋 Verification Checklist

After applying fixes, run these commands:

```bash
# 1. Build all packages
pnpm build

# 2. Run linters
pnpm lint

# 3. Run tests
pnpm --filter api test

# 4. Check for vulnerabilities
pnpm audit --audit-level=moderate

# 5. Type check
pnpm --filter web typecheck

# 6. Check build artifacts
ls -la packages/shared/dist/
ls -la apps/web/.next/
```

**Expected Results:**
- ✅ All builds pass
- ✅ No linting errors (warnings ok)
- ✅ Tests pass
- ✅ 0 moderate+ vulnerabilities
- ✅ No TypeScript errors
- ✅ Build artifacts present

---

## 🎯 Success Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Security Vulnerabilities | 4 | 0 | -100% |
| TypeScript Errors | 1 | 0 | -100% |
| Lint Configuration | Broken | Working | ✅ Fixed |
| Console.log Usage | 100+ | <10 | -90% |
| Overall Health Score | 87/100 | 92/100 | +5 points |

---

## 📝 Notes

- **Time Estimate:** Total ~3-5 hours for all fixes
- **Risk Level:** Low (all changes are improvements)
- **Testing Required:** Yes, run full test suite after changes
- **Deployment:** Can be deployed immediately after verification

**Priority Order:**
1. Security vulnerabilities (CRITICAL)
2. TypeScript config (BLOCKS BUILD)
3. Lint config (QUALITY)
4. Console.log replacement (PRODUCTION READINESS)
5. Environment validation (STABILITY)

---

**Created:** February 12, 2026  
**Based on:** REPOSITORY_AUDIT_100_COMPLETE.md  
**Status:** Ready for execution
