# 🎯 Infrastructure & Development Recommendations

**Date**: February 2, 2026  
**Status**: Post-Deployment Analysis  
**Deployments**: Vercel (<https://infamous.vercel.app>) + Fly.io (infamous-freight-as-3gw)

---

## 📋 Executive Summary

Your infrastructure is **deployed and functional**, with impressive features including:

- ✅ Commercial-grade security headers
- ✅ Edge proxy with geolocation
- ✅ Comprehensive error handling
- ✅ SEO optimization
- ✅ 60+ enterprise features

However, there are **20 high-impact improvements** that will enhance reliability, performance, and developer experience.

---

## 🚨 Critical (Fix Immediately)

### 1. Restart Fly.io API Backend ⚠️

**Status**: Both Fly.io machines are **stopped** (checked Feb 2, 2026 23:29 UTC)

```bash
# Quick fix - start both machines
flyctl machines start 891220f4d66638 --app infamous-freight-as-3gw
flyctl machines start 2863554c69d968 --app infamous-freight-as-3gw

# Verify status
flyctl status --app infamous-freight-as-3gw

# Or use the new helper script
pnpm run status:fly
```

**Why**: Your API backend is offline. Any features requiring backend services are broken.

**Cost**: ~$0 to fix (machines auto-stop to save costs, but shouldn't be stopped in production)

---

### 2. Complete CI/CD Configuration

**Missing GitHub Secrets**:

- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**How to get**:

```bash
cd apps/web
npx vercel link  # Links to existing project
cat .vercel/project.json  # Contains orgId and projectId
```

**Then add to GitHub**:

1. Go to <https://github.com/MrMiless44/Infamous-freight/settings/secrets/actions>
2. Click "New repository secret"
3. Add `VERCEL_ORG_ID` with value from `.vercel/project.json`
4. Add `VERCEL_PROJECT_ID` with value from `.vercel/project.json`

**Why**: Enables automatic Vercel deployments via GitHub Actions on every push to `main`.

**File**: [.github/workflows/vercel-deploy.yml](.github/workflows/vercel-deploy.yml)

---

## 🔥 High Priority (This Week)

### 3. Add Production Domain

**Current**: `https://infamous.vercel.app`  
**Recommended**: `https://app.infamousfreight.com` or `https://freight.infamous.io`

```bash
# Option A: Via Vercel CLI
npx vercel domains add infamousfreight.com --scope infaemous

# Option B: Via Vercel Dashboard
# 1. Go to https://vercel.com/infaemous/infamous/settings/domains
# 2. Add domain
# 3. Update DNS records as instructed
```

**Benefits**:

- Professional branding
- Better SEO (custom domain ranks higher)
- SSL certificate auto-provisioned
- Automatic www → non-www redirect

**Cost**: Domain registration (~$12/year via Vercel or external registrar)

---

### 4. Connect Database Layer

**Current Status**: Health checks show `"supabase": false`

**Options**:

#### Option A: Vercel Postgres (Recommended for Web)

```bash
# 1. Install integration
npx vercel integration add neon

# 2. Get connection string from Vercel dashboard
# 3. Add to .env.local:
DATABASE_URL=postgresql://user:pass@host.vercel.com:5432/verceldb?sslmode=require

# 4. Update apps/web/lib/db.ts to use Prisma or pg
```

**Pros**: Serverless, auto-scaling, built-in connection pooling  
**Cons**: Limited to 512 MB on free tier  
**Cost**: Free tier available, paid starts at $10/month

#### Option B: Supabase (Full-Stack Platform)

```bash
# 1. Sign up at https://supabase.com
# 2. Create new project
# 3. Get credentials from Project Settings → Database
# 4. Add to environment:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

**Pros**: Auth built-in, real-time subscriptions, storage, edge functions  
**Cons**: More complex, additional vendor dependency  
**Cost**: Free tier available, paid starts at $25/month

#### Option C: Fly.io Postgres (API Backend)

```bash
# Create database cluster on Fly.io
flyctl postgres create --name infamous-freight-db --region ord

# Attach to API app
flyctl postgres attach infamous-freight-db --app infamous-freight-as-3gw

# Get connection string
flyctl secrets list --app infamous-freight-as-3gw | grep DATABASE_URL
```

**Pros**: Co-located with API, low latency, full PostgreSQL  
**Cons**: Requires management, backups not automatic  
**Cost**: ~$5/month for small instance

**Recommendation**: Start with **Vercel Postgres** for web, keep Fly.io API stateless until you need it.

---

### 5. Implement Edge Config for Feature Flags

**Current**: [apps/web/proxy.ts](apps/web/proxy.ts#L108) has placeholder `X-Feature-Flags-Status: ready`

**Setup**:

```bash
# 1. Create Edge Config store
npx vercel env add EDGE_CONFIG

# 2. Go to https://vercel.com/infaemous/infamous/stores
# 3. Create new Edge Config store
# 4. Add feature flags:
{
  "enableAICommands": true,
  "enableDarkMode": false,
  "maintenanceMode": false,
  "rateLimitMultiplier": 1.0
}
```

**Update proxy.ts**:

```typescript
import { get } from '@vercel/edge-config';

export async function proxy(request: NextRequest) {
  // Check maintenance mode
  const maintenanceMode = await get('maintenanceMode');
  if (maintenanceMode) {
    return new NextResponse('Under maintenance', { status: 503 });
  }

  // Get AI commands feature flag
  const enableAI = await get('enableAICommands');
  response.headers.set('X-Feature-Flags', JSON.stringify({ enableAI }));
  
  return response;
}
```

**Benefits**:

- Toggle features without redeploying
- A/B testing support
- Gradual rollouts (e.g., 10% of users)
- Emergency kill switch

**Cost**: Free up to 10,000 reads/month

---

### 6. Add Vercel Redis for Caching

**Current**: [apps/web/lib/kv-store.ts](apps/web/lib/kv-store.ts#L12) notes "KV is deprecated"

**Setup**:

```bash
# 1. Add Redis integration
npx vercel integration add vercel-redis

# 2. Get connection string from dashboard
# Automatically added as REDIS_URL environment variable

# 3. Install client
pnpm add @vercel/redis --filter web
```

**Use Cases**:

```typescript
// apps/web/lib/redis.ts
import { Redis } from '@vercel/redis';

const redis = Redis.fromEnv();

// Session management
export async function setSession(userId: string, data: any) {
  await redis.setex(`session:${userId}`, 3600, JSON.stringify(data));
}

// API response caching
export async function getCachedData(key: string) {
  return await redis.get(`cache:${key}`);
}

// Rate limiting
export async function checkRateLimit(ip: string, limit: number) {
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60); // 60 seconds
  return count <= limit;
}
```

**Benefits**:

- Sub-millisecond response times
- Distributed rate limiting across regions
- Session persistence
- Cache expensive API calls

**Cost**: Free tier (256 MB), paid starts at $10/month

---

## 💎 Medium Priority (Next 2 Weeks)

### 7. Fix Markdown Linting (1,173 errors)

**Files affected**: All `.md` documentation files

**Quick fix**:

```bash
# Install markdownlint globally
pnpm add -D markdownlint-cli2

# Auto-fix most issues
pnpm dlx markdownlint-cli2-fix "**/*.md"

# Check remaining issues
pnpm dlx markdownlint-cli2 "**/*.md"
```

**Common issues**:

- Missing blank lines around headings
- Bare URLs (use markdown links)
- Code blocks without language specifiers
- Trailing punctuation in headings

**Why**: Professional documentation, easier for AI assistants to parse, better GitHub rendering.

---

### 8. Enable Real Rate Limiting with Redis

**Current**: [apps/api/src/middleware/security.js](apps/api/src/middleware/security.js#L32) has in-memory rate limiters

**Problem**: In-memory limiters don't work across multiple instances (each machine has its own counter)

**Solution**: Connect to Redis backend

**Setup**:

```bash
# 1. Add Vercel Redis (see recommendation #6)

# 2. Update API to use Redis store
cd apps/api
pnpm add rate-limit-redis redis
```

**Update security.js**:

```javascript
// apps/api/src/middleware/security.js
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Connect to Redis
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
  }
});
redisClient.connect();

// Update limiters to use Redis
export const limiters = {
  general: rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:general:'
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later'
  }),
  
  auth: rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:auth:'
    }),
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts'
  }),
  
  ai: rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:ai:'
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: 'AI rate limit exceeded'
  })
};
```

**Test**:

```bash
# Make 101 requests in 15 minutes - 101st should be blocked
for i in {1..101}; do
  curl -w "\n%{http_code}\n" https://infamous-freight-as-3gw.fly.dev/api/health
done
```

**Benefits**: True rate limiting across all instances, prevents abuse, protects API costs.

---

### 9. Add Sentry Error Tracking

**Current**: Code references Sentry but no DSN configured

**Setup**:

```bash
# 1. Sign up at https://sentry.io
# 2. Create new project (Next.js + Node.js)
# 3. Get DSN from Project Settings

# 4. Add to Vercel environment
npx vercel env add NEXT_PUBLIC_SENTRY_DSN
npx vercel env add SENTRY_DSN
npx vercel env add SENTRY_AUTH_TOKEN  # For source maps

# 5. Add to Fly.io
flyctl secrets set SENTRY_DSN=https://xxx@sentry.io/xxx --app infamous-freight-as-3gw
```

**Benefits**:

- Real-time error alerts
- Stack traces with source maps
- User session replay
- Performance monitoring (APM)
- Release tracking

**Cost**: Free tier (5,000 errors/month), paid starts at $29/month

**File**: [apps/api/src/middleware/errorHandler.js](apps/api/src/middleware/errorHandler.js) already has Sentry integration

---

### 10. Enable Vercel Analytics & Speed Insights

**Current**: `@vercel/analytics@1.6.1` installed but not enabled

**Setup**:

```bash
# 1. Go to Vercel dashboard
# https://vercel.com/infaemous/infamous/settings/analytics

# 2. Enable both:
#    - Analytics (audience metrics)
#    - Speed Insights (Web Vitals)

# 3. Already wired in apps/web/pages/_app.tsx
# No code changes needed!
```

**Metrics tracked**:

- **Analytics**: Page views, unique visitors, top pages, referrers, devices
- **Speed Insights**: LCP, FID, CLS, TTFB (Core Web Vitals)

**Benefits**:

- Understand user behavior
- Detect performance regressions
- Optimize based on real user data
- Track Core Web Vitals for SEO

**Cost**: Included with Pro plan ($20/month), limited on Hobby

---

### 11. Strengthen Content Security Policy

**Current**: Basic CSP in [apps/web/proxy.ts](apps/web/proxy.ts#L72)

**Enhanced CSP**:

```typescript
// apps/web/proxy.ts - Update proxy function
response.headers.set(
  'Content-Security-Policy',
  [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.vercel.app https://*.supabase.co https://vitals.vercel-insights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ')
);
```

**Test CSP**:

```bash
# Check for CSP violations in browser console
# Open DevTools → Console → Check for CSP errors
# Example: "Refused to load script because it violates CSP"
```

**Report CSP violations**:

```typescript
// Add reporting endpoint
response.headers.set(
  'Content-Security-Policy-Report-Only',  // Test mode first
  "default-src 'self'; report-uri /api/security/csp-report"
);
```

**Benefits**: Prevents XSS attacks, clickjacking, code injection, data exfiltration.

---

### 12. Create Health Check Monitoring

**Current**: Health endpoints exist but no monitoring

**Setup with BetterStack** (Recommended):

```bash
# 1. Sign up at https://betterstack.com/uptime
# 2. Add two monitors:

# Monitor #1: Vercel Web
URL: https://infamous.vercel.app/api/health
Interval: 60 seconds
Expected: HTTP 200
Alert on: 3 consecutive failures
Notifications: Email, Slack, PagerDuty

# Monitor #2: Fly.io API
URL: https://infamous-freight-as-3gw.fly.dev/api/health
Interval: 60 seconds
Expected: HTTP 200, JSON response with "status"
Alert on: 3 consecutive failures
```

**Alternative tools**:

- **Cronitor**: <https://cronitor.io> (free tier, great UI)
- **Healthchecks.io**: <https://healthchecks.io> (simple, cheap)
- **UptimeRobot**: <https://uptimerobot.com> (free tier, basic)

**Set up status page**:

```bash
# BetterStack provides public status page
# Example: https://status.infamousfreight.com
```

**Benefits**:

- 24/7 uptime monitoring
- Instant alerts on downtime
- Historical uptime data
- Public status page for customers

**Cost**: Free tier available, paid starts at $18/month

---

## ⚡ Performance Optimizations

### 13. Enable Incremental Static Regeneration (ISR)

**Target pages**: Landing page, pricing, about, docs

**Example**:

```typescript
// apps/web/pages/index.tsx
export async function getStaticProps() {
  // Fetch pricing data, testimonials, etc.
  const data = await fetchHomePageData();
  
  return {
    props: { data },
    revalidate: 3600, // Regenerate every hour (or on-demand)
  };
}
```

**On-demand revalidation**:

```typescript
// apps/web/pages/api/revalidate.ts
export default async function handler(req, res) {
  // Protect this endpoint!
  if (req.query.secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    await res.revalidate('/');
    await res.revalidate('/pricing');
    return res.json({ revalidated: true });
  } catch (err) {
    return res.status(500).send('Error revalidating');
  }
}
```

**Benefits**:

- Near-instant page loads (served from edge cache)
- Reduced server load (static HTML served for most requests)
- Better SEO (faster LCP, better Core Web Vitals)

**Best for**: Marketing pages, documentation, pricing pages that change weekly/monthly

---

### 14. Optimize Images with Next.js Image Component

**Current**: Some pages likely use `<img>` tags

**Audit**:

```bash
# Find all <img> tags in web app
grep -r '<img' apps/web/pages/ apps/web/components/
```

**Replace with Next.js Image**:

```typescript
// Before
<img src="/logo.png" alt="Logo" />

// After
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority={true}  // For above-the-fold images
/>
```

**For remote images**:

```typescript
// Add domain to next.config.js (already configured at line 35)
<Image
  src="https://cdn.example.com/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
/>
```

**Benefits**:

- Automatic WebP/AVIF conversion (already enabled in config)
- Responsive images (different sizes for apps/mobile/desktop)
- Lazy loading (images below fold load on scroll)
- Blur placeholder while loading

**Impact**: Typically 40-60% reduction in image payload size.

---

### 15. Bundle Size Analysis & Optimization

**Run analyzer**:

```bash
cd apps/web
ANALYZE=true pnpm build
```

**Opens browser showing**:

- Which packages are largest
- Duplicate dependencies
- Unused code

**Common optimizations**:

```typescript
// 1. Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('../components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false  // Skip SSR for client-only components
});

// 2. Tree-shake lodash
// ❌ import _ from 'lodash';
// ✅ import debounce from 'lodash/debounce';

// 3. Code-split routes (automatic in Next.js)
// Each page in pages/ is a separate chunk

// 4. Lazy-load non-critical modules
const exportToExcel = async () => {
  const XLSX = await import('xlsx');
  // Use XLSX here
};
```

**Targets**:

- **First Load JS**: < 150 KB (current: check `pnpm build` output)
- **Total Bundle**: < 500 KB
- **Largest Chunk**: < 200 KB

**Already optimized** in [next.config.js](apps/web/next.config.js#L52):

- Code splitting by vendor (React, Stripe, Charts, Supabase)
- Tree shaking enabled
- Minification enabled
- GZIP compression enabled

---

## 🔒 Security Hardening

### 16. Add Vercel Firewall (Enterprise only)

**Alternative**: Cloudflare in front of Vercel

**Setup Cloudflare**:

```bash
# 1. Add custom domain to Vercel (see recommendation #3)
# 2. Sign up at https://cloudflare.com
# 3. Add site, update nameservers
# 4. Enable:
#    - DDoS protection (automatic)
#    - WAF (Web Application Firewall)
#    - Bot protection
#    - Rate limiting at edge
```

**Cloudflare WAF rules**:

- Block known bad IPs
- Challenge suspicious traffic
- Block common attack patterns (SQL injection, XSS)

**Cost**: Free tier available, Pro $20/month

---

### 17. Implement API Key Rotation

**Current**: JWT tokens don't expire/rotate

**Add to [apps/api/src/middleware/security.js](apps/api/src/middleware/security.js)**:

```javascript
// Generate new JWT secret every 30 days
export function rotateJWTSecret() {
  const newSecret = crypto.randomBytes(64).toString('hex');
  
  // Store in KMS or environment variable manager
  updateSecretInVault('JWT_SECRET', newSecret);
  
  // Invalidate old tokens after grace period (7 days)
  scheduleTokenInvalidation(7);
}

// Run via cron job or scheduled task
// Fly.io: flyctl secrets set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
```

**Benefits**: Limits blast radius if secret is compromised.

---

### 18. Add Security Headers Validation Tests

**Test suite**:

```typescript
// apps/web/tests/security.test.ts
import { describe, it, expect } from 'vitest';

describe('Security Headers', () => {
  it('should have CSP header', async () => {
    const res = await fetch('https://infamous.vercel.app');
    expect(res.headers.get('content-security-policy')).toBeDefined();
  });

  it('should have HSTS header', async () => {
    const res = await fetch('https://infamous.vercel.app');
    const hsts = res.headers.get('strict-transport-security');
    expect(hsts).toContain('max-age=');
    expect(hsts).toContain('includeSubDomains');
  });

  it('should prevent clickjacking', async () => {
    const res = await fetch('https://infamous.vercel.app');
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
  });
});
```

**Run in CI**:

```yaml
# .github/workflows/security-tests.yml
name: Security Tests
on: [push]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm test:security
```

---

## 🎨 Developer Experience

### 19. Add Pre-commit Hooks

**Setup Husky + lint-staged**:

```bash
pnpm add -D husky lint-staged

# Initialize Husky
npx husky init

# Create pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
chmod +x .husky/pre-commit
```

**Configure lint-staged** in `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ],
    "*.md": [
      "markdownlint-cli2-fix"
    ]
  }
}
```

**Benefits**:

- Catch errors before pushing
- Auto-format code on commit
- Enforce code style consistency
- Prevent broken commits

**Bypassing** (when needed):

```bash
git commit --no-verify -m "Emergency fix"
```

---

### 20. Create Developer Onboarding Checklist

**New file**: `ONBOARDING.md`

```markdown
# Developer Onboarding

## Prerequisites
- [ ] Node.js 20+ installed
- [ ] pnpm 9+ installed (`npm install -g pnpm`)
- [ ] Docker Desktop running (for local API)
- [ ] GitHub account with repo access

## Setup (15 minutes)
1. Clone repo: `git clone git@github.com:MrMiless44/Infamous-freight.git`
2. Install dependencies: `pnpm install`
3. Copy environment: `cp .env.example .env.local`
4. Fill in required variables (see step 4)
5. Start services: `pnpm dev`

## Required Environment Variables
- `DATABASE_URL` - Get from team lead
- `NEXT_PUBLIC_SUPABASE_URL` - In 1Password vault
- `JWT_SECRET` - In 1Password vault
- `SENTRY_DSN` - In Sentry dashboard

## Verify Setup
- [ ] Web app: http://localhost:3000
- [ ] API health: http://localhost:4000/api/health
- [ ] Supabase Studio: `pnpm supabase:studio`

## Development Workflow
1. Create branch: `git checkout -b feature/my-feature`
2. Make changes
3. Test locally: `pnpm test`
4. Push: `git push origin feature/my-feature`
5. Create PR on GitHub
6. Wait for CI checks to pass
7. Request review from team

## Common Commands
- `pnpm dev` - Start all services
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm lint` - Check code quality
- `pnpm status` - Check deployment status

## Troubleshooting
- **Port 3000 in use**: `lsof -ti:3000 | xargs kill -9`
- **Shared package not found**: `pnpm build:shared`
- **Test database errors**: `pnpm supabase:reset`

## Resources
- [Project README](README.md)
- [Quick Reference](QUICK_REFERENCE.md)
- [Architecture Docs](DOCUMENTATION_INDEX.md)
- [Copilot Instructions](.github/copilot-instructions.md)
```

---

## 📊 Metrics & Success Criteria

### Performance Targets

- **Lighthouse Score**: 90+ (all categories)
- **Core Web Vitals**:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms
- **Bundle Size**: First Load JS < 150KB

### Reliability Targets

- **Uptime**: 99.9% (< 43 minutes downtime/month)
- **Error Rate**: < 0.1% (1 error per 1,000 requests)
- **API Response Time**: P95 < 500ms, P99 < 1s
- **Zero Critical Security Issues**: No CVEs in dependencies

### Development Velocity

- **Deploy Time**: < 5 minutes (main → production)
- **PR Review Time**: < 24 hours
- **Bug Fix Time**: < 48 hours
- **Feature Ship Time**: < 2 weeks (design → production)

---

## 💰 Cost Estimate

| Service                 | Tier                 | Monthly Cost  |
| ----------------------- | -------------------- | ------------- |
| **Vercel**              | Pro                  | $20           |
| **Fly.io**              | Starter (2 machines) | $10           |
| **Vercel Postgres**     | Starter              | $10           |
| **Vercel Redis**        | Starter              | $10           |
| **Vercel Edge Config**  | Free                 | $0            |
| **Vercel Analytics**    | Included             | $0            |
| **Sentry**              | Team                 | $29           |
| **BetterStack**         | Basic                | $18           |
| **Domain**              | .com registration    | $1/month      |
| **Cloudflare**          | Pro (optional)       | $20           |
| **Total (Recommended)** |                      | **$98/month** |
| **Total (Minimum)**     |                      | **$50/month** |

**Scaling costs** (1M requests/month):

- Vercel: Included in Pro
- Fly.io: ~$30 (4 machines)
- Database: ~$25 (more storage/connections)
- **Total**: ~$150/month

---

## 🗓️ Implementation Timeline

### Week 1 (Critical)

- [ ] Restart Fly.io machines
- [ ] Add GitHub CI/CD secrets
- [ ] Connect Vercel Postgres
- [ ] Add Vercel Redis
- [ ] Enable Sentry error tracking

### Week 2 (High Priority)

- [ ] Add custom domain
- [ ] Set up Edge Config
- [ ] Fix markdown linting
- [ ] Enable rate limiting with Redis
- [ ] Set up health check monitoring

### Week 3 (Medium Priority)

- [ ] Optimize images
- [ ] Enable ISR for static pages
- [ ] Run bundle analyzer
- [ ] Strengthen CSP headers
- [ ] Add pre-commit hooks

### Week 4 (Polish)

- [ ] Add security tests
- [ ] Create onboarding docs
- [ ] Set up Cloudflare (optional)
- [ ] Implement API key rotation
- [ ] Performance optimization review

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Performance Best Practices](https://nextjs.org/docs/pages/building-your-application/optimizing)
- [Fly.io Scaling Guide](https://fly.io/docs/reference/scaling/)
- [Web.dev Core Web Vitals](https://web.dev/vitals/)
- [OWASP Security Guidelines](https://owasp.org/)

---

## ✅ Quick Wins (Can Do Today)

```bash
# 1. Restart Fly.io machines (5 minutes)
flyctl machines start 891220f4d66638 --app infamous-freight-as-3gw
flyctl machines start 2863554c69d968 --app infamous-freight-as-3gw

# 2. Add GitHub secrets (10 minutes)
cd apps/web && npx vercel link
# Copy orgId and projectId to GitHub secrets

# 3. Enable Vercel Analytics (2 minutes)
# Just toggle in Vercel dashboard - already wired in code

# 4. Fix markdown lint errors (10 minutes)
pnpm add -D markdownlint-cli2
pnpm dlx markdownlint-cli2-fix "**/*.md"

# 5. Set up health monitoring (15 minutes)
# Sign up at https://betterstack.com/uptime
# Add two monitors (Vercel + Fly.io)
```

**Total time**: ~42 minutes for massive improvements! 🚀

---

## 🎯 Next Steps

1. **Review this document** with your team
2. **Prioritize recommendations** based on your goals
3. **Create GitHub issues** for each task
4. **Assign owners** and deadlines
5. **Track progress** in project board

Questions? Open an issue or reach out to DevOps team.

---

**Document Version**: 1.0  
**Last Updated**: February 2, 2026  
**Maintained By**: DevOps Team  
**Review Cycle**: Monthly
