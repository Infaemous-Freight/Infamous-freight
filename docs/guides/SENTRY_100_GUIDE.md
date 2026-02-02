# Sentry 100% Implementation Guide

**Status:** Production-Ready | **Date:** February 2, 2026

Complete end-to-end error tracking, performance monitoring, and incident management with Sentry.

---

## 🎯 Quick Start (5 minutes)

### Step 1: Create Sentry Organization

```bash
# Go to https://sentry.io and sign up
# Create organization: "Infæmous Freight"
# Create projects:
#  - infamous-freight-web (Next.js)
#  - infamous-freight-api (Node.js)
```

### Step 2: Get DSNs

```bash
# For each project:
# Settings → Client Keys → Copy DSN
# Format: https://xxxxx@sentry.io/PROJECT_ID
```

### Step 3: Configure Secrets

```bash
# Set in GitHub → Settings → Secrets and variables → Environment secrets (production):
gh secret set SENTRY_DSN --env production "https://xxxxx@sentry.io/xxxxx"
gh secret set SENTRY_AUTH_TOKEN --env production "YOUR_SENTRY_AUTH_TOKEN"
gh secret set NEXT_PUBLIC_SENTRY_DSN --env production "https://xxxxx@sentry.io/xxxxx"
gh secret set SENTRY_RELEASE --env production "$(git rev-parse --short HEAD)"
```

### Step 4: Deploy

```bash
# Just push to main - Vercel auto-deploys with Sentry configured
git add .
git commit -m "chore: Add Sentry 100% configuration"
git push origin main
```

### Step 5: Test

```bash
# Trigger a test error
curl -X POST https://your-app.vercel.app/api/test-error \
  -H "Content-Type: application/json" \
  -d '{"message":"Sentry test"}'

# Check Sentry dashboard in 30-60 seconds
# https://sentry.io/organizations/infamousfreight/issues/
```

---

## 📊 Architecture Overview

### Sentry Components

```
Sentry Frontend Dashboard
    ↓
Sentry Backend (sentry.io)
    ↓
    ├→ Web App (Next.js)    [Client-side errors + performance]
    ├→ API Server (Express) [Server-side errors + performance]
    └→ Vercel Integration   [Deployment tracking + release info]
```

### Error Flow

```
1. Error occurs in app
   ↓
2. Sentry SDK captures error + context
   ↓
3. Error sent to sentry.io over HTTPS
   ↓
4. Alert triggered (if configured)
   ↓
5. Engineer notified and investigates
```

---

## 🔧 Configuration Details

### Web App (Next.js)

**Environment Variables:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_SENTRY_RELEASE=v1.0.0
```

**Auto-initialized via:**
- `apps/web/src/lib/sentry.client.config.ts` - Client SDK setup
- `apps/web/pages/_app.tsx` - Automatic initialization on app boot
- Next.js SDK handles server-side errors automatically

**Features:**
- ✅ Client-side error capture
- ✅ Server-side error capture (via Next.js API routes)
- ✅ Performance monitoring (Web Vitals)
- ✅ Session Replay (user interaction recording)
- ✅ Source maps for readable stack traces
- ✅ Error boundaries with React integration

### API Server (Express)

**Environment Variables:**
```bash
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
SENTRY_RELEASE=v1.0.0
NODE_ENV=production
```

**Initialization Order (critical):**
```javascript
// 1. First line of apps/api/src/server.js
require("./instrument.js");

// 2. Enhanced config via apps/api/src/config/sentry-enhanced.js
const { initializeSentry, attachRequestHandler } = require("./config/sentry-enhanced.js");
initializeSentry();
app.use(attachRequestHandler(app));  // Before routes

// 3. Error handler (after all routes)
const { attachErrorHandler } = require("./config/sentry-enhanced.js");
attachErrorHandler(app);
```

**Features:**
- ✅ Unhandled exception capture
- ✅ Unhandled rejection capture
- ✅ Request/response tracking
- ✅ Performance transactions
- ✅ Custom breadcrumbs for debugging
- ✅ User context (userId, email)

---

## 📈 Performance Monitoring

### What Gets Tracked

**Web App:**
- Page load performance
- React component rendering
- RPC/API call duration
- Core Web Vitals (LCP, FID, CLS)
- User session replay

**API Server:**
- Endpoint response time
- Database query duration
- External API calls
- Error rate per endpoint
- Request volume

### Viewing Performance Data

```
Sentry Dashboard → Performance → Transactions
  ├→ Web App Transactions (e.g., "GET /dashboard")
  ├→ API Transactions (e.g., "POST /api/shipments")
  └→ Database Operations
      ├→ Query duration distribution
      ├→ P95, P99 latencies
      └→ Error rate
```

### Sample Rate Configuration

**Web App:**
- Development: 100% of transactions (full visibility)
- Production: 10% of transactions (cost control)

**API Server:**
- Development: 100% of transactions
- Production: 10% of transactions

Adjust in environment variables or code:
```javascript
// apps/web/src/lib/sentry.client.config.ts
tracesSampleRate: isDevelopment ? 1.0 : 0.1,

// apps/api/src/config/sentry-enhanced.js
tracesSampleRate: isDevelopment ? 1.0 : Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
```

---

## 🚨 Error Handling Best Practices

### Automatic Capture (no code needed)

✅ Handled automatically:
- Uncaught exceptions
- Promise rejections
- React render errors
- Next.js API errors
- Database errors
- Network timeouts

### Manual Error Capture (when needed)

**In Web App:**
```typescript
import { captureException, captureMessage } from "@/lib/sentry.client.config";

try {
  await fetchData();
} catch (error) {
  // Capture with context
  captureException(error as Error, {
    endpoint: "/api/shipments",
    userId: user.id,
  });
}

// Capture informational message
captureMessage("Important business event", "info");
```

**In API Server:**
```javascript
const Sentry = require("./config/sentry-enhanced.js");

try {
  await database.query(...);
} catch (error) {
  Sentry.captureException(error, {
    tags: { service: "database", operation: "insert" },
    data: { table: "shipments" }
  });
  res.status(500).json({ error: "Database error" });
}
```

### Error Context Example

```typescript
import Sentry from "@sentry/nextjs";
import { addBreadcrumb, setUserContext } from "@/lib/sentry.client.config";

// Set user context when they log in
function onUserLogin(user) {
  setUserContext(user.id, user.email);
}

// Add breadcrumbs for debugging
function onShipmentCreated(shipment) {
  addBreadcrumb(
    `Shipment created: ${shipment.id}`,
    "shipment",
    "info",
    { shipmentId: shipment.id, driver: shipment.driverId }
  );
}

// Capture error with full context
try {
  await submitForm();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      form: "shipment-creation",
      step: "payment-processing",
    },
    user: {
      id: currentUser.id,
    },
  });
}
```

---

## 📋 Alerts & Notifications

### Create Alert in Sentry

**Alert for Error Spike:**
```
1. Sentry Dashboard → Alerts → Create Alert Rule
2. Filter: All Events
3. Condition: When event.environment is 'production'
              AND error.rate >= 10 errors in 5 minutes
4. Actions: Send Email to devops@infamousfreight.com
5. Save and test
```

**Alert for Critical Errors:**
```
1. Filter: All Events
2. Condition: When level is 'error'
              AND tags.severity is 'critical'
3. Actions: Send Slack notification
4. Create routing to #incidents channel
```

**Slack Integration:**
```
1. Sentry Settings → Integrations → Slack
2. Click "Install"
3. Authorize Sentry in your Slack workspace
4. Choose channel (e.g., #alerts or #incidents)
5. Test: Create a test error in your app
```

### Recommended Alerts

For production, create alerts:
- [ ] Error spike (5+ errors in 5 minutes)
- [ ] Critical errors (tagged with severity=critical)
- [ ] 5xx errors on API
- [ ] Performance degradation (P95 > 5s)
- [ ] Daily digest (summary email)

---

## 🔍 Debugging with Source Maps

### Why Source Maps?

Without source maps:
```
Error at line 12345 in chunk-abc123.js
(unhelpful - minified code)
```

With source maps:
```
Error in ShipmentForm.tsx line 45: "Cannot read property 'id' of null"
(helpful - original code with exact location)
```

### Upload Source Maps Automatically

**GitHub Actions Workflow:**
Already configured in `.github/workflows/deploy.yml`:

```yaml
- name: Upload source maps to Sentry
  run: |
    npm install -g @sentry/cli
    sentry-cli releases files upload-sourcemaps ./apps/web/.next
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: infamousfreight
    SENTRY_PROJECT: infamous-freight-web
```

**Manual Upload (for development):**
```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Build your app
pnpm build

# Upload source maps
sentry-cli releases files upload-sourcemaps \
  --org infamousfreight \
  --project infamous-freight-web \
  ./apps/web/.next
```

---

## 🔐 Security & Privacy

### Data Collection

**Web App Collects:**
- Error messages and stack traces
- Browser info (not user data)
- URL path (not query params)
- User ID (if authenticated)
- Session replay (sanitized)

**API Server Collects:**
- Error messages and stack traces
- Request headers (sanitized)
- Database error info (not passwords)
- User context (if authenticated)

### Sensitive Data Handling

**Automatically Redacted:**
- API keys and tokens
- Passwords and credentials
- Email addresses (unless explicitly set)
- File paths with sensitive names

**Custom Filtering in Sentry:**
```javascript
// apps/web/src/lib/sentry.client.config.ts
beforeSend(event, hint) {
  // Remove sensitive query params
  if (event.request?.url) {
    event.request.url = event.request.url
      .replace(/[?&]api_key=[^&]*/i, "?api_key=REDACTED")
      .replace(/[?&]token=[^&]*/i, "&token=REDACTED");
  }
  return event;
}
```

### GDPR Compliance

**Data Retention:**
- Development: 30 days
- Production: 90 days (default)
- Can be configured in Sentry Settings

**Data Deletion:**
- Per-event deletion in Sentry dashboard
- Bulk deletion via API
- Automatic purging after retention period

---

## 📊 Dashboard & Reporting

### Key Metrics to Monitor

**Daily:**
```
Sentry Dashboard → Issues
├→ Unresolved issues: should trend down
├→ Error rate: should stay < 0.1%
├→ P95 latency: watch for spikes
└→ Recent releases: mark as healthy or rollback
```

**Weekly:**
```
Sentry Dashboard → Analytics
├→ Error trends
├→ Most impactful errors
├→ Performance regressions
└→ User impact analysis
```

**Monthly:**
```
Review → Sentry Reports
├→ Error summary
├→ Performance summary
├→ Top affected users
└→ Release stability report
```

### Custom Dashboards

**Create Dashboard:**
```
1. Sentry → Dashboards → Create Dashboard
2. Add charts:
   - Error rate over time
   - P95 latency trend
   - Errors by service
   - User satisfaction
3. Set auto-refresh to 5 minutes
4. Share with team
```

---

## 🧪 Testing Sentry Integration

### Test Error Capture

**Web App:**
```bash
# In browser console
throw new Error("Test error from browser");

# Should appear in Sentry within 30 seconds
```

**API:**
```bash
# Via curl
curl -X POST https://your-api.vercel.app/api/test-error \
  -H "Content-Type: application/json" \
  -d '{"message":"Test API error"}'

# Should appear in Sentry within 30 seconds
```

### Verify Configuration

**Checklist:**
- [ ] Sentry DSN is set in GitHub secrets
- [ ] Web app shows Sentry in devtools (check for "_sf_async_config")
- [ ] API server logs "Sentry initialized" on startup
- [ ] Test error appears in Sentry within 30 seconds
- [ ] Error shows correct source maps (not minified)
- [ ] User context includes userId
- [ ] Breadcrumbs show event timeline

### Health Check

```bash
# Verify Sentry is capturing
curl -X GET https://your-api.vercel.app/api/health

# Response should include sentry status:
# {"ok":true,"sentry":"connected",...}
```

---

## 🚀 Deployment Checklist

**Before Going Live:**

```bash
# 1. Create Sentry projects for web and API
# 2. Get DSNs from Sentry Settings → Client Keys
# 3. Set GitHub secrets
gh secret set SENTRY_DSN --env production "https://xxxxx@sentry.io/xxxxx"
gh secret set NEXT_PUBLIC_SENTRY_DSN --env production "https://yyyyy@sentry.io/yyyyy"
gh secret set SENTRY_AUTH_TOKEN --env production "YOUR_AUTH_TOKEN"
gh secret set SENTRY_RELEASE --env production "$(git rev-parse --short HEAD)"

# 4. Verify secrets are set
gh secret list --env production | grep SENTRY

# 5. Trigger test deployment
git push origin main

# 6. Test error capture
curl -X POST https://your-app.vercel.app/api/test-error

# 7. Verify in Sentry dashboard
# https://sentry.io/organizations/infamousfreight/issues/

# 8. Configure alerts (see section above)
# 9. Create Slack integration
# 10. Set resolution time (auto-resolve after 48h)
```

---

## 📚 Configuration Files Reference

### Web App (`apps/web/src/lib/sentry.client.config.ts`)
- Client-side SDK initialization
- Performance monitoring setup
- Session replay configuration
- Error filtering logic

### API Server (`apps/api/src/config/sentry-enhanced.js`)
- Server-side SDK initialization
- Request/response tracking
- Performance transaction setup
- Error filtering logic

### Next.js Config (`apps/web/next.config.mjs`)
- Webpack plugin for source map generation
- SDK loader configuration
- Release tracking setup

### Environment Variables
```bash
# Web App
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_RELEASE=v1.0.0
NEXT_PUBLIC_ENV=production

# API Server
SENTRY_DSN=https://yyyyyy@sentry.io/yyyyy
SENTRY_AUTH_TOKEN=YOUR_AUTH_TOKEN
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_RELEASE=v1.0.0
```

---

## 🔗 Links & Resources

**Sentry Documentation:**
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Node.js Guide](https://docs.sentry.io/platforms/node/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

**Our Setup:**
- Web App Config: `apps/web/src/lib/sentry.client.config.ts`
- API Config: `apps/api/src/config/sentry-enhanced.js`
- Setup Script: `scripts/setup-sentry.sh`

**Sentry Dashboard:**
- Organization: https://sentry.io/organizations/infamousfreight/
- Web Project: https://sentry.io/organizations/infamousfreight/issues/?project=xxxxx
- API Project: https://sentry.io/organizations/infamousfreight/issues/?project=yyyyy

---

## 🆘 Troubleshooting

### "Sentry DSN not configured"

```bash
# Check env var
echo $SENTRY_DSN

# Or in GitHub Actions
gh secret list --env production | grep SENTRY_DSN

# Should see: SENTRY_DSN = https://xxxxx@sentry.io/xxxxx
```

### Errors Not Appearing in Sentry

```bash
# 1. Check browser console for Sentry SDK
window.__SENTRY__ in browser devtools

# 2. Check API logs
docker logs infamous-freight-api | grep Sentry

# 3. Verify network request (DevTools → Network → sentry.io)
# Should see POST requests to cdn.sentry-cdn.com

# 4. Check Sentry quota not exceeded
# Sentry Dashboard → Settings → Usage & Quota
```

### Source Maps Not Working

```bash
# 1. Ensure source maps are generated during build
ls -la apps/web/.next/static/chunks/*.js.map

# 2. Verify upload in Sentry
# Sentry → Release → Source Maps tab

# 3. Re-upload manually
npm install -g @sentry/cli
sentry-cli releases files upload-sourcemaps \
  --org infamousfreight \
  --project infamous-freight-web \
  ./apps/web/.next
```

### High Error Volume

```bash
# Reduce sample rate in production
# apps/api/src/config/sentry-enhanced.js
tracesSampleRate: 0.01  // 1% instead of 10%

# Or filter in beforeSend callback
beforeSend(event, hint) {
  // Filter low-priority errors
  if (event.level === "warning") {
    return null;  // Don't send warnings
  }
  return event;
}
```

---

## ✅ Success Criteria

Your Sentry setup is 100% complete when:

- [x] Web app errors appear in Sentry within 30 seconds
- [x] API errors captured with full context
- [x] Performance transactions tracked for both app and API
- [x] Source maps available (readable stack traces)
- [x] User context included in errors
- [x] Alerts configured and tested
- [x] Slack integration working
- [x] Dashboard configured and shared with team
- [x] Documentation in place for on-call team
- [x] Test suite validates Sentry integration

