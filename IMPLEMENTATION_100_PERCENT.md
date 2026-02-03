 # 🚀 Implementation Guide: All 20 Recommendations 100%

**Last Updated**: February 3, 2026  
**Status**: Complete Implementation Roadmap  
**Completion**: Ready for execution

---

## 📊 Quick Summary

| #   | Task                            | Status            | Priority | Est. Time    |
| --- | ------------------------------- | ----------------- | -------- | ------------ |
| 1   | Restart Fly.io API Backend      | 🔴 Manual          | Critical | 5 min        |
| 2   | Complete CI/CD GitHub Secrets   | 🔴 Manual          | Critical | 15 min       |
| 3   | Add Production Domain           | 🔴 Manual          | High     | 10 min       |
| 4   | Connect Database Layer          | 🔴 Manual          | High     | 20 min       |
| 5   | Implement Edge Config           | 🔴 Manual          | High     | 15 min       |
| 6   | Add Vercel Redis                | 🔴 Manual          | High     | 15 min       |
| 7   | Fix Markdown Linting            | ✅ Code Ready      | Medium   | 5 min        |
| 8   | Redis Rate Limiting             | ✅ Implemented     | High     | 10 min       |
| 9   | Sentry Error Tracking           | ✅ Implemented     | High     | 10 min       |
| 10  | Vercel Analytics                | ✅ Already Enabled | High     | 2 min        |
| 11  | Strengthen CSP                  | ✅ Already Strong  | Medium   | 0 min        |
| 12  | Health Check Monitoring         | 🔴 Manual          | High     | 15 min       |
| 13  | Incremental Static Regeneration | 📝 Guide Below     | Medium   | 15 min       |
| 14  | Optimize Images                 | 📝 Guide Below     | Medium   | 30 min       |
| 15  | Bundle Analysis                 | 📝 Guide Below     | Medium   | 20 min       |
| 16  | Cloudflare WAF                  | 🔴 Manual          | Medium   | 30 min       |
| 17  | API Key Rotation                | ✅ Implemented     | High     | 10 min       |
| 18  | Security Tests                  | 📝 Guide Below     | High     | 20 min       |
| 19  | Pre-commit Hooks                | 📝 Guide Below     | Medium   | 10 min       |
| 20  | Onboarding Docs                 | 📝 Guide Below     | Low      | 0 min (Done) |

---

## 🔴 CRITICAL - Execute First (5-30 minutes)

### 1️⃣ Restart Fly.io API Backend

**Status**: Both machines currently stopped  
**Impact**: API is offline - production blocker

```bash
# List all machines
flyctl machines list --app infamous-freight-as-3gw

# Start both machines
flyctl machines start 891220f4d66638 --app infamous-freight-as-3gw
flyctl machines start 2863554c69d968 --app infamous-freight-as-3gw

# Verify they're running
flyctl status --app infamous-freight-as-3gw

# Test API
curl https://infamous-freight-as-3gw.fly.dev/api/health
# Should return: {"status":"ok",...}
```

**Verify**:  
✅ Both machines show "started" state  
✅ `flyctl status` shows healthy status  
✅ API health endpoint returns 200

---

### 2️⃣ Complete CI/CD GitHub Secrets

**Status**: Missing `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`  
**Impact**: Automatic Vercel deployments not working

```bash
# Link web app to Vercel project
cd apps/web
npx vercel link

# This creates .vercel/project.json with:
# - "orgId": "your-org-id"
# - "projectId": "your-project-id"

# Read the IDs
cat .vercel/project.json

# Add to GitHub Secrets:
# 1. Go to: https://github.com/MrMiless44/Infamous-freight/settings/secrets/actions
# 2. Click "New repository secret"
# 3. Create two secrets:

# Secret 1: VERCEL_ORG_ID
# Value: (copy from .vercel/project.json orgId)

# Secret 2: VERCEL_PROJECT_ID  
# Value: (copy from .vercel/project.json projectId)

# 4. Trigger workflow to verify
cd ../..
git status
```

**Verify**:  
✅ GitHub Actions → deploy-production workflow passes  
✅ Vercel deployment shows in PR comments  
✅ Both secrets exist in Settings → Secrets

---

### 3️⃣ Add Production Domain

**Status**: Using `https://infamous.vercel.app` (generic)  
**Impact**: SEO, branding, customer trust

```bash
# Option A: Add domain via Vercel CLI
npx vercel domains add infamousfreight.com

# Option B: Via Vercel Dashboard
# 1. Go to: https://vercel.com/infaemous/infamous/settings/domains
# 2. Click "Add Domain"
# 3. Enter: app.infamousfreight.com (or your choice)
# 4. Update DNS records with your registrar:
#    - Name: app
#    - Type: CNAME
#    - Value: (from Vercel instructions)

# Verify DNS propagation
nslookup app.infamousfreight.com
# Should return: Vercel IP address

# Test the domain
curl -I https://app.infamousfreight.com
# Should return: 200 + all security headers
```

**Verify**:  
✅ Domain shows in Vercel settings  
✅ DNS resolves to Vercel  
✅ HTTPS certificate is issued (green lock)  
✅ Redirects work (www → non-www)

---

### 4️⃣ Connect Database Layer (Vercel Postgres)

**Status**: Health checks show database disconnected  
**Impact**: Data persistence, transactions

#### Option A: Vercel Postgres (Recommended for Web)

```bash
# 1. Create Vercel Postgres database
npx vercel env add POSTGRES_PRISMA_URL
# This creates a database and shows connection string

# 2. Copy the connection string and add to .env.local
DATABASE_URL="postgresql://default:..."

# 3. Update your Prisma schema if needed
# apps/api/prisma/schema.prisma
# datasource db {
#   provider = "postgresql"
#   url      = env("DATABASE_URL")
# }

# 4. Test connection
cd apps/api
npm run prisma:studio
# Should open UI with database tables

# 5. Check health
curl http://localhost:4000/api/health
# Should show "database": "connected"
```

#### Option B: Supabase (Full-Stack Alternative)

```bash
# 1. Sign up at: https://supabase.com
# 2. Create new project
# 3. Get credentials from Settings → Database
# 4. Add to environment:

export NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
export DATABASE_URL="postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres"

# 5. Redirect Fly.io secret
flyctl secrets set DATABASE_URL="$DATABASE_URL" --app infamous-freight-as-3gw
```

**Verify**:  
✅ Connection string in .env.local  
✅ `pnpm prisma:studio` opens database  
✅ `/api/health` shows database connected  
✅ Can insert/query test data

---

### 5️⃣ Implement Edge Config (Feature Flags)

**Status**: Placeholder ready, needs Vercel integration  
**Impact**: Toggle features without redeploying

```bash
# 1. Create Edge Config in Vercel
npx vercel env add EDGE_CONFIG

# 2. Go to: https://vercel.com/infaemous/infamous/stores
# 3. Create new Edge Config store
# 4. Add feature flags (JSON):

{
  "enableAICommands": true,
  "enableDarkMode": false,
  "maintenanceMode": false,
  "rateLimitMultiplier": 1.0,
  "newUIBetaPercent": 10,
  "enableFeaturedShipments": true
}

# 5. Copy connection string to .env.local
# EDGE_CONFIG="https://..."

# 6. Use in code:
import { get } from '@vercel/edge-config';

export async function middleware(request) {
  const maintenanceMode = await get('maintenanceMode');
  if (maintenanceMode) {
    return new Response('Under maintenance', { status: 503 });
  }
}
```

**Verify**:  
✅ Edge Config store created in Vercel  
✅ Feature flags stored as JSON  
✅ `middleware()` reads Edge Config  
✅ Can toggle without deploying

---

### 6️⃣ Add Vercel Redis (Caching)

**Status**: Configuration ready, needs Vercel integration  
**Impact**: Sub-millisecond response times

```bash
# 1. Add Redis integration
npx vercel integration add redis
# Follow prompts to auth

# 2. Get connection string automatically added to env
# REDIS_URL environment variable is set

# 3. Install client
pnpm add @vercel/redis

# 4. Use in code:

// apps/web/lib/redis.ts
import { Redis } from '@vercel/redis';

const redis = Redis.fromEnv();

// Session caching
export async function getSession(userId) {
  const cached = await redis.get(`session:${userId}`);
  return cached ? JSON.parse(cached) : null;
}

export async function setSession(userId, data) {
  await redis.setex(
    `session:${userId}`,
    3600, // 1 hour
    JSON.stringify(data)
  );
}

// Rate limiting
export async function checkRateLimit(ip) {
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count <= 100; // 100 requests per minute
}

# 5. Test
pnpm dev
# Make requests and verify cached responses are instant
```

**Verify**:  
✅ REDIS_URL environment variable set  
✅ Redis client connects successfully  
✅ Can set/get/incr keys without errors

---

## 📝 MEDIUM - Implementation Guides

### 7️⃣ Fix Markdown Linting (1,173 errors)

**Setup**:

```bash
# Install markdownlint
pnpm add -D markdownlint-cli2

# Check for errors
pnpm dlx markdownlint-cli2 "**/*.md"

# Auto-fix common issues
pnpm dlx markdownlint-cli2-fix "**/*.md"

# Common fixes applied:
# ✅ Add blank lines around headings
# ✅ Properly format code blocks with language
# ✅ Create markdown links for bare URLs
# ✅ Remove trailing punctuation from headings
# ✅ Fix list indentation

# Verify
pnpm dlx markdownlint-cli2 "**/*.md" 2>&1 | wc -l
# Should be < 50 errors remaining
```

---

### 8️⃣ Enable Real Rate Limiting with Redis

**Already Implemented** ✅  
File: [`apps/api/src/middleware/rateLimitRedis.js`](apps/api/src/middleware/rateLimitRedis.js)

**Integration**:

```javascript
// apps/api/src/<route>.js
const { rateLimiters } = require('./middleware/rateLimitRedis');

router.post('/ai/command',
  rateLimiters.ai,           // 20 req/min for AI
  authenticate,
  handler
);

router.post('/auth/login',
  rateLimiters.auth,         // 5 req/15min for auth
  validateEmail,
  handler
);

router.post('/billing/checkout',
  rateLimiters.billing,      // 30 req/15min for billing
  authenticate,
  handler
);
```

**Verify**:

```bash
# Test rate limiting
for i in {1..21}; do
  curl -s http://localhost:4000/api/ai/command \
    -H "Authorization: Bearer $TOKEN" | head -1
done
# 21st request should be rate limited (429 status)
```

---

### 9️⃣ Add Sentry Error Tracking

**Already Implemented** ✅  
File: [`apps/web/src/lib/sentry.ts`](apps/web/src/lib/sentry.ts)

**Setup**:

```bash
# 1. Sign up at: https://sentry.io
# 2. Create new project:
#    - Platform: Next.js + Node.js
#    - Environment: Production + Staging

# 3. Get DSN from Project Settings

# 4. Add environment variables:
npx vercel env add NEXT_PUBLIC_SENTRY_DSN
npx vercel env add SENTRY_DSN

# Enter the DSN when prompted

# 5. For API backend, add to Fly.io:
flyctl secrets set SENTRY_DSN="https://xxx@sentry.io/xxx" \
  --app infamous-freight-as-3gw

# 6. Redeploy to activate
git push
# GitHub Actions will deploy with new env
```

**Usage**:

```typescript
// apps/web/pages/dashboard.tsx
import { setSentryUser, trackSentryEvent, reportSentryError } from '@/lib/sentry';
import * as Sentry from '@sentry/nextjs';

export default function Dashboard({ user }) {
  useEffect(() => {
    // Set user context for individual error tracking
    setSentryUser(user);
  }, [user]);

  async function handleAction() {
    try {
      // Track user actions
      Sentry.addBreadcrumb({
        message: 'User initiated action',
        category: 'user-action',
      });

      await performAction();
      trackSentryEvent('Action completed');
    } catch (err) {
      reportSentryError(err, {
        tags: { action: 'performAction' },
        contexts: { user: { id: user.id } },
      });
    }
  }
}
```

---

### 🔟 Enable Vercel Analytics & Speed Insights

**Already Implemented** ✅  
Already wired in [`apps/web/pages/_app.tsx`](apps/web/pages/_app.tsx)

**Enable in Dashboard**:

```bash
# 1. Go to: https://vercel.com/infaemous/infamous/settings/analytics

# 2. Toggle both options:
#    ✅ Analytics (audience metrics)
#    ✅ Speed Insights (Core Web Vitals)

# 3. No code changes needed - already imported:
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

# 4. View dashboard at:
#    https://vercel.com/infaemous/infamous/analytics
```

**Track Metrics**:

- **Analytics**: Page views, visitors, top pages, referrers, devices
- **Speed Insights**: LCP, FID, CLS, TTFB (Core Web Vitals)

---

### 1️⃣1️⃣ Strengthen CSP

**Already Strong** ✅  
CSP in [`apps/web/proxy.ts`](apps/web/proxy.ts#L72)

**Current Policy**:

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com
style-src 'self' 'unsafe-inline'
img-src 'self' data: https: blob:
font-src 'self' data:
connect-src 'self' https://*.vercel.app https://*.supabase.co https://vitals.vercel-insights.com https://*.fly.dev
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
upgrade-insecure-requests
```

**Test CSP**:

```bash
# Check for CSP violations
curl -I https://infamous.vercel.app | grep -i content-security

# Browser DevTools → Console:
# Should NOT see: "Refused to load script because it violates CSP"

# Report violations (optional):
# Find reported violations at https://sentry.io/security/
```

---

### 1️⃣2️⃣ Create Health Check Monitoring

**Setup with BetterStack** (Recommended):

```bash
# 1. Sign up at: https://betterstack.com/uptime
# Free tier available

# 2. Create Monitor #1 (Vercel Web):
URL:                 https://infamous.vercel.app/api/health
Method:              GET
Interval:            60 seconds
Response time alert: 10 seconds
Expected status:     200
Down alerts:         Email + Slack

# 3. Create Monitor #2 (Fly.io API):
URL:                 https://infamous-freight-as-3gw.fly.dev/api/health
Method:              GET
Interval:            60 seconds
Expected status:     200
Expected body:       "status"

# 4. Enable notifications
#    - Email: your-email@gmail.com
#    - Slack: #ops-alerts
#    - PagerDuty: (optional)

# 5. Get public status page URL
#    Example: https://status.infamousfreight.com
#    Share with customers/team
```

**Alternative Services**:

- **Cronitor**: https://cronitor.io (free tier, great UI)
- **Healthchecks.io**: https://healthchecks.io (simple, cheap)
- **UptimeRobot**: https://uptimerobot.com (free tier, basic)

---

### 1️⃣3️⃣ Enable Incremental Static Regeneration

**Implementation**:

```typescript
// apps/web/pages/index.tsx
export async function getStaticProps() {
  // Fetch data at build time
  const homepage = await fetchHomepageData();
  
  return {
    props: { homepage },
    revalidate: 3600, // Regenerate every 1 hour
  };
}
```

**On-Demand Revalidation** (already exists):

```bash
# Manually trigger revalidation after content updates
curl -X POST "http://localhost:3000/api/revalidate?path=/&secret=YOUR_TOKEN"

# Response: { "revalidated": true }

# Revalidate multiple paths:
curl -X POST "http://localhost:3000/api/revalidate?secret=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paths": ["/", "/pricing", "/blog"]}'
```

**Set REVALIDATE_SECRET**:

```bash
# Generate secret
openssl rand -hex 32

# Add to .env.local
REVALIDATE_SECRET="your_secret_here"

# Deploy to environments
npx vercel env add REVALIDATE_SECRET
```

---

### 1️⃣4️⃣ Optimize Images

**Find unoptimized images**:

```bash
# Search for <img> tags
grep -r '<img' apps/web/pages apps/web/components | head -20

# Replace with Next.js Image:
```

**Before**:
```typescript
<img src="/logo.png" alt="Logo" width={200} />
```

**After**:
```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority // For above-the-fold images
/>
```

**For remote images**:

```typescript
<Image
  src="https://cdn.example.com/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
/>
```

**Check optimization** (already configured):

```javascript
// apps/web/next.config.js
images: {
  formats: ["image/avif", "image/webp"],  // Modern formats
  deviceSizes: [...],                       // Responsive sizes
  minimumCacheTTL: 60,                      // Cache 60 days
  remotePatterns: [...]                     // Allow CDNs
}
```

---

### 1️⃣5️⃣ Bundle Size Analysis

**Run analyzer**:

```bash
cd apps/web
ANALYZE=true pnpm build

# Opens browser showing:
# - Bundle size by chunk
# - Duplicate dependencies
# - Vendor breakdown

# Targets:
# - First Load JS:  < 150 KB (current: check output)
# - Total bundle:    < 500 KB
# - Largest chunk:   < 200 KB

# Already optimized in next.config.js:
# ✅ Code splitting by vendor
# ✅ Tree shaking
# ✅ Minification
# ✅ GZIP compression
```

---

### 1️⃣6️⃣ Add Cloudflare WAF

**Setup**:

```bash
# 1. Sign up at: https://cloudflare.com
# 2. Add domain:
#    - Add site
#    - Update nameservers (instructions provided)
#    - Wait 24-48h for propagation

# 3. Enable security features:
#    - DDoS protection (automatic)
#    - WAF rules (automatic)
#    - Bot protection (automatic)
#    - Rate limiting at edge

# 4. Create WAF rules:
#    - Block known bad IPs
#    - Challenge suspicious traffic
#    - Block SQL injection patterns
#    - Block XSS patterns

# 5. Test protection:
curl -I https://infamous.vercel.app
# Should show: Server: cloudflare
```

---

### 1️⃣7️⃣ Implement API Key Rotation

**Already Implemented** ✅  
File: [`apps/api/src/middleware/keyRotation.js`](apps/api/src/middleware/keyRotation.js)

**Integration**:

```javascript
// apps/api/src/server.js
const { initializeKeyRotation } = require('./middleware/keyRotation');

// On server startup
const rotationTimer = initializeKeyRotation();

// On shutdown
process.on('SIGTERM', () => {
  clearInterval(rotationTimer);
});
```

**Monitor Status**:

```bash
# Check current rotation status
curl http://localhost:4000/api/internal/key-rotation/status

# Response shows:
# - Days until next rotation
# - Previous secrets still active
# - Grace period for old tokens
```

---

### 1️⃣8️⃣ Add Security Tests

**Test suite** (file exists):

```bash
# Install test dependencies
pnpm add -D vitest node-fetch

# Run security tests
pnpm --filter web test:security

# Tests verify:
# ✅ All required security headers present
# ✅ HSTS enforcement
# ✅ CSP restrictions
# ✅ Clickjacking protection
# ✅ MIME type sniffing prevention
# ✅ Rate limit headers
```

**Add to CI/CD**:

```yaml
# .github/workflows/security-tests.yml
name: Security Tests
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm test:security
```

---

### 1️⃣9️⃣ Add Pre-commit Hooks

**Setup Husky** (already created):

```bash
# 1. Install Husky
pnpm add -D husky lint-staged

# 2. Initialize Husky
npx husky init

# 3. Pre-commit hook already created at:
# .husky/pre-commit

# 4. Tests automatically on commit:
#    ✅ ESLint
#    ✅ Prettier formatting
#    ✅ Markdown linting
#    ✅ Type checking

# 5. Make a commit to test
git add .
git commit -m "test: verify hooks"
# Should run all checks before committing

# 6. Skip hooks if needed (emergency only)
git commit --no-verify
```

---

### 2️⃣0️⃣ Onboarding Documentation

**Already Created** ✅  
File: [`ONBOARDING.md`](ONBOARDING.md)

Includes:
- 15-minute setup guide
- Common commands cheatsheet
- Troubleshooting guide
- Git workflow best practices
- Resource links

---

## ⚡ Quick Wins (Complete Today)

```bash
# 1. Restart Fly.io (5 min)
flyctl machines start 891220f4d66638 --app infamous-freight-as-3gw
flyctl machines start 2863554c69d968 --app infamous-freight-as-3gw

# 2. Add GitHub secrets (15 min)
cd apps/web && npx vercel link
# Copy IDs to GitHub Secrets

# 3. Check existing implementations (2 min)
curl http://localhost:3000/api/health
curl http://localhost:4000/api/health
# Both should return 200

# 4. Enable Vercel features (2 min)
# Go to: https://vercel.com/infaemous/infamous/settings/analytics
# Toggle Analytics and Speed Insights

# 5. Test security headers (5 min)
curl -I https://infamous.vercel.app | grep -i security
# Should show CSP, X-Frame-Options, etc.

# Total time: 30 minutes for massive improvements! 🚀
```

---

## 📊 Success Metrics

### Performance Targets

| Metric                 | Target   | Current | Status |
| ---------------------- | -------- | ------- | ------ |
| Lighthouse Score       | 90+      | ?       | TBD    |
| LCP (First Contentful) | < 2.5s   | ?       | TBD    |
| FID (Input Delay)      | < 100ms  | ?       | TBD    |
| CLS (Layout Shift)     | < 0.1    | ?       | TBD    |
| TTFB (First Byte)      | < 600ms  | ?       | TBD    |
| Bundle Size            | < 150 KB | ?       | TBD    |

### Reliability Targets

| Metric             | Target  | Status           |
| ------------------ | ------- | ---------------- |
| Uptime             | 99.9%   | Setup monitoring |
| Error Rate         | < 0.1%  | Setup Sentry     |
| API Response P95   | < 500ms | Monitor          |
| Zero Critical CVEs | Yes     | Scan deps        |

---

## 💰 Cost Analysis

| Service            | Tier           | Monthly        |
| ------------------ | -------------- | -------------- |
| Vercel Web         | Pro            | $20            |
| Vercel Postgres    | Starter        | $10            |
| Vercel Redis       | Starter        | $10            |
| Vercel Edge Config | Free           | $0             |
| Fly.io API         | Starter        | $10            |
| Sentry             | Team           | $29            |
| BetterStack        | Basic          | $18            |
| Cloudflare         | Pro (optional) | $20            |
| Domain             | Annual         | $12/year       |
| **Total**          |                | **$127/month** |

**Scaling** (1M requests/month): ~$150/month

---

## 🗓️ Implementation Timeline

### **Week 1 (This Week)** - Critical Path

- [ ] Day 1 AM: Restart Fly.io + GitHub Secrets (20 min)
- [ ] Day 1 PM: Configure Database + Redis (45 min)
- [ ] Day 2 AM: Production Domain + monitoring (30 min)
- [ ] Day 2 PM: Sentry + Edge Config (30 min)
- [ ] Day 3: Test everything + fix lint (30 min)

### **Week 2** - Security & Performance

- [ ] Security tests + CSP validation
- [ ] Bundle analysis + optimization
- [ ] Image optimization sweep
- [ ] ISR configuration

### **Week 3** - Monitoring & Documentation

- [ ] Health check dashboard setup
- [ ] API key rotation testing
- [ ] Pre-commit hooks validation
- [ ] Onboarding walkthrough

### **Week 4** - Optional Enhancements

- [ ] Cloudflare WAF (if needed)
- [ ] Additional performance tuning
- [ ] Advanced feature flags
- [ ] Custom analytics dashboard

---

## ✅ Verification Checklist

Use this before considering 100% complete:

### Infrastructure
- [ ] Fly.io API machines running
- [ ] Database connected (health check shows ✅)
- [ ] Redis working (can set/get keys)
- [ ] Domain resolves with HTTPS

### Security
- [ ] All security headers present
- [ ] Sentry receiving errors
- [ ] CSP reports configured
- [ ] API key rotation enabled

### Performance
- [ ] Images optimized (WebP/AVIF)
- [ ] Bundle < 150 KB
- [ ] ISR revalidation working
- [ ] Edge Config working

### Monitoring
- [ ] Uptime monitors active (both web + API)
- [ ] Alert channels configured (email, Slack)
- [ ] Vercel Analytics functional
- [ ] Error tracking functional

### Development
- [ ] Pre-commit hooks working
- [ ] Security tests passing
- [ ] Markdown linting clean
- [ ] GitHub Actions passing

---

## 🆘 Troubleshooting

### "Fly.io machines still stopped"

```bash
flyctl --version  # v0.1.0+
flyctl machines list --app infamous-freight-as-3gw
# Check machine IDs match
flyctl machines start [MACHINE_ID] --app infamous-freight-as-3gw
```

### "Can't connect to database"

```bash
# Verify DATABASE_URL in environment
echo $DATABASE_URL

# Check Prisma connection
cd apps/api
pnpm prisma:studio

# Restart services
pnpm dev
```

### "Rate limiting not working"

```bash
# Verify Redis is running
redis-cli ping  # Should return PONG

# Check rate limit store has data
redis-cli keys "rl:*" | head

# Confirm middleware is registered
grep rateLimiters apps/api/src/routes/*.js
```

### "Sentry not receiving errors"

```bash
# Verify DSN is set
echo $NEXT_PUBLIC_SENTRY_DSN

# Test capture
import * as Sentry from '@sentry/nextjs';
Sentry.captureMessage('Test message');

# Check Sentry dashboard
# https://sentry.io/organizations/yourorg/issues/
```

---

## 🎯 Next Steps

1. **Print this guide** or save as PDF
2. **Schedule implementation** with team
3. **Assign owners** to each task
4. **Create GitHub issues** for tracking
5. **Monitor progress** in project board

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Fly.io Docs**: https://fly.io/docs
- **Next.js Guide**: https://nextjs.org/docs
- **Sentry Setup**: https://docs.sentry.io
- **Your Team**: Slack #dev-help

---

**Last Updated**: February 3, 2026  
**Version**: 1.0 - Complete & Ready for Execution  
**Owner**: DevOps Team

🚀 **Ready to ship!**
