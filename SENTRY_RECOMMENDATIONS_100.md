# Sentry Integration - 100% Recommendations & Optimizations

**Date**: February 2, 2026  
**Status**: Architecture Review Complete  
**Priority**: Critical for Production Readiness  

---

## 🎯 Priority 1: Critical Optimizations (MUST DO)

### 1.1 Add Sentry Replay Integration Enhancements

**Issue**: Session replay needs additional privacy controls  
**Impact**: Prevent sensitive data leakage in recordings  
**Action**: Update `sentry.client.config.ts`

```typescript
// Add to Replay integration
new Sentry.Replay({
  maskAllText: true,
  blockAllMedia: true,
  
  // Additional privacy patterns
  maskAllInputs: true, // Mask all form inputs
  
  // Add custom rejection rules
  beforeCreateReplayFrame: (frame) => {
    // Reject frames with sensitive content
    const sensitiveSelectors = [
      '[data-sentry-ignore]',
      '.credit-card-input',
      '.password-field',
      '[aria-label*="password"]'
    ];
    
    const isSensitive = sensitiveSelectors.some(selector =>
      frame.element?.matches?.(selector)
    );
    
    return !isSensitive ? frame : null;
  },
}),
```

### 1.2 Add API Response Interceptor

**Issue**: Missing tracking of API errors and responses  
**Impact**: Incomplete error context for API failures  
**Action**: Create [apps/web/src/lib/sentry-api.ts](../apps/web/src/lib/sentry-api.ts)

```typescript
/**
 * Sentry API Interceptor
 * Captures API request/response data for better error context
 */

import * as Sentry from "@sentry/nextjs";
import { ApiResponse } from "@infamous-freight/shared";

export interface InterceptedError extends Error {
  status?: number;
  response?: ApiResponse<any>;
  url?: string;
  method?: string;
}

export const captureApiError = (
  error: InterceptedError,
  context?: Record<string, unknown>
) => {
  Sentry.captureException(error, {
    contexts: {
      api: {
        status: error.status,
        url: error.url,
        method: error.method,
        response: error.response,
      },
    },
    tags: {
      source: "api",
      component: "web",
    },
    ...context,
  });
};

export const trackApiCall = (
  method: string,
  url: string,
  duration: number,
  status: number
) => {
  Sentry.captureMessage(
    `API ${method} ${url} - ${duration}ms [${status}]`,
    "info"
  );

  // Track performance
  const span = Sentry.getActiveTransaction()?.startChild({
    op: "http.client",
    description: `${method} ${url}`,
    data: {
      duration,
      status,
      method,
      url,
    },
  });

  if (span) {
    span.setTag("http.status_code", status);
  }
};
```

### 1.3 Add User Activity Tracking

**Issue**: Missing crucial user context for debugging  
**Impact**: Can't correlate errors to specific user actions  
**Action**: Update [apps/web/src/context/AuthContext.tsx](../apps/web/src/context/AuthContext.tsx)

Add to your auth provider:

```typescript
import { setUserContext, clearUserContext } from "@/src/lib/sentry.client.config";

// In login handler
const handleLogin = (user) => {
  setUserContext(user.id, user.email);
  // Also add tags for user properties
  Sentry.setTag("user_role", user.role);
  Sentry.setTag("user_type", user.type);
};

// In logout handler
const handleLogout = () => {
  clearUserContext();
};
```

### 1.4 Add Performance Monitoring for Critical Operations

**Issue**: Missing performance data for critical user flows  
**Impact**: Can't identify performance bottlenecks  
**Action**: Create [apps/web/src/lib/sentry-performance.ts](../apps/web/src/lib/sentry-performance.ts)

```typescript
/**
 * Sentry Performance Monitoring
 * Track critical operations
 */

import * as Sentry from "@sentry/nextjs";

export class PerformanceMonitor {
  private transaction: Sentry.Transaction | undefined;
  private spans: Map<string, Sentry.Span> = new Map();

  start(name: string, op: string): void {
    this.transaction = Sentry.startTransaction({
      name,
      op,
    });
  }

  startSpan(key: string, op: string, description: string): void {
    if (!this.transaction) {
      console.warn("Transaction not started. Call start() first.");
      return;
    }

    const span = this.transaction.startChild({
      op,
      description,
      timestamp: Date.now() / 1000,
    });

    this.spans.set(key, span);
  }

  endSpan(key: string): void {
    const span = this.spans.get(key);
    if (span) {
      span.finish();
      this.spans.delete(key);
    }
  }

  addTag(key: string, value: string | number): void {
    if (this.transaction) {
      this.transaction.setTag(key, value);
    }
  }

  finish(): void {
    if (this.transaction) {
      this.transaction.finish();
      this.transaction = undefined;
    }
    this.spans.clear();
  }
}

// Usage Example
export async function trackShipmentUpdate(shipmentId: string) {
  const monitor = new PerformanceMonitor();
  monitor.start("Update Shipment", "shipment.update");
  monitor.addTag("shipment_id", shipmentId);

  try {
    monitor.startSpan("fetch", "http.client", "Fetch shipment data");
    const shipment = await getShipment(shipmentId);
    monitor.endSpan("fetch");

    monitor.startSpan("update", "db.query", "Update shipment in database");
    await updateShipment(shipment);
    monitor.endSpan("update");

    monitor.startSpan("notify", "notification", "Send update notification");
    await notifyStakeholders(shipment);
    monitor.endSpan("notify");
  } catch (error) {
    Sentry.captureException(error);
  } finally {
    monitor.finish();
  }
}
```

---

## 🎯 Priority 2: Enhanced Features (SHOULD DO)

### 2.1 Add Sentry Release Health Tracking

**Issue**: No visibility into release stability  
**Impact**: Can't correlate issues to specific releases  
**Action**: Add to `next.config.mjs`

```javascript
export default withSentryConfig(nextConfig, {
  // ... existing config ...
  
  // Track release health
  include: ["./src"],
  ignore: ["page-static", "page-dynamic"],
  
  // Release tracking
  urlPrefix: process.env.NEXT_PUBLIC_APP_URL,
  
  // Environment-specific configuration
  rewriteSourcesContent: process.env.NODE_ENV === "development" ? true : false,
});
```

### 2.2 Add Custom Error Classes with Sentry Integration

**Issue**: Generic error handling doesn't provide context  
**Impact**: Difficult to categorize and debug errors  
**Action**: Create [apps/web/src/lib/sentry-errors.ts](../apps/web/src/lib/sentry-errors.ts)

```typescript
/**
 * Custom Error Classes with Sentry Integration
 */

export class ShipmentError extends Error {
  constructor(message: string, public shipmentId: string, public statusCode?: number) {
    super(message);
    this.name = "ShipmentError";
    
    // Auto-capture with Sentry
    Sentry.captureException(this, {
      tags: {
        error_type: "shipment",
        shipment_id: shipmentId,
      },
      contexts: {
        shipment: { id: shipmentId },
      },
    });
  }
}

export class PaymentError extends Error {
  constructor(message: string, public orderId: string, public provider: string) {
    super(message);
    this.name = "PaymentError";
    
    Sentry.captureException(this, {
      tags: {
        error_type: "payment",
        provider,
      },
      fingerprint: ["payment", this.provider],
    });
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields: Record<string, string[]>) {
    super(message);
    this.name = "ValidationError";
    
    Sentry.captureException(this, {
      tags: {
        error_type: "validation",
      },
      contexts: {
        validation: { fields: this.fields },
      },
    });
  }
}
```

### 2.3 Add Sentry Issue Templates

**Issue**: No standardized issue format  
**Impact**: Difficult to search and filter issues  
**Action**: Create project rules in Sentry dashboard

1. **Go to Project Settings → Issue Grouping Functions**
2. Add custom grouping rules:

```
# Rule 1: Group payment errors by provider
if(error.error_group == "PaymentError") {
  tags.provider
}

# Rule 2: Group API errors by endpoint
if(error.type == "ApiError") {
  error.stacktrace.frames[-1].function
}

# Rule 3: Group shipment errors by shipment_id
if(tags.error_type == "shipment") {
  tags.shipment_id
}
```

### 2.4 Add Performance Budgets

**Issue**: No alerts for performance degradation  
**Impact**: Performance issues not caught early  
**Action**: Set up alerts in Sentry

```bash
# In Sentry: Alerts → New Alert Rule

Name: "Web Performance Degradation"
Condition:
  - If event.measurements.fcp > 2500
  - OR event.measurements.lcp > 4000
  - AND event.transaction != /health|metrics/
Action:
  - Slack notification to #performance-alerts
  - Create an issue
```

### 2.5 Add Environment-Specific Configuration Files

**Issue**: Need different Sentry settings per environment  
**Impact**: Can't optimize sampling per environment efficiently  
**Action**: Create environment-specific configs

Create `apps/web/sentry.config.ts`:

```typescript
/**
 * Environment-specific Sentry configuration
 */

interface SentryConfig {
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  maxBreadcrumbs: number;
  captureFeedback: boolean;
  attachStacktrace: boolean;
}

const configs: Record<string, SentryConfig> = {
  development: {
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    maxBreadcrumbs: 100,
    captureFeedback: true,
    attachStacktrace: true,
  },
  staging: {
    tracesSampleRate: 0.5,
    replaysSessionSampleRate: 0.2,
    replaysOnErrorSampleRate: 1.0,
    maxBreadcrumbs: 75,
    captureFeedback: true,
    attachStacktrace: true,
  },
  production: {
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    maxBreadcrumbs: 50,
    captureFeedback: false,
    attachStacktrace: false,
  },
};

export function getSentryConfig(env: string): SentryConfig {
  return configs[env] || configs.production;
}
```

Then use in `sentry.client.config.ts`:

```typescript
import { getSentryConfig } from "./sentry.config";

const config = getSentryConfig(process.env.NEXT_PUBLIC_ENV || "production");

Sentry.init({
  // ... other config ...
  tracesSampleRate: config.tracesSampleRate,
  replaysSessionSampleRate: config.replaysSessionSampleRate,
  maxBreadcrumbs: config.maxBreadcrumbs,
});
```

---

## 🎯 Priority 3: Optional Enhancements (NICE TO HAVE)

### 3.1 Add Slack Integration

**In Sentry Dashboard**:

1. Go to **Integrations → Slack**
2. Install and configure
3. Set up alerts to specific channels

### 3.2 Add GitHub Integration

**In Sentry Dashboard**:

1. Go to **Integrations → GitHub**
2. Configure to create issues automatically
3. Link to repo commits

### 3.3 Add Email Alerts

**In Sentry Dashboard**:

1. **Alerts → New Alert Rule**
2. Condition: Errors > 10 in 5 minutes
3. Action: Send email to team

### 3.4 Add Sentry CLI Scripts

**In `package.json`**:

```json
"scripts": {
  "sentry:release": "sentry-cli releases create -p javascript-nextjs",
  "sentry:finalize": "sentry-cli releases finalize -p javascript-nextjs",
  "sentry:deploy": "sentry-cli releases deploys -p javascript-nextjs create",
  "sentry:sourcemaps": "sentry-cli releases files -p javascript-nextjs list",
  "sentry:check": "sentry-cli issues list --project javascript-nextjs | head -20"
}
```

---

## 🔍 Verification Checklist

Run these to verify the integration is production-ready:

```bash
# 1. Check DSN is configured
echo $NEXT_PUBLIC_SENTRY_DSN

# 2. Verify Sentry files exist
ls -la apps/web/sentry*.ts
ls -la apps/web/instrumentation.ts
ls -la apps/web/components/SentryErrorBoundary.tsx

# 3. Test build
pnpm --filter web build

# 4. Verify source maps
ls -la apps/web/.next/static/chunks/ | grep ".js.map"

# 5. Test error capture locally
pnpm --filter web dev
# Visit http://localhost:3000/debug-sentry
# Trigger error and check Sentry dashboard

# 6. Verify performance monitoring
# Check browser Network tab for /sentry requests
```

---

## 📊 Optimization Summary

| #       | Recommendation           | Priority | Effort | Impact | Status |
| ------- | ------------------------ | -------- | ------ | ------ | ------ |
| 1.1     | Enhanced Replay Privacy  | Critical | 30min  | High   | ⏳ TODO |
| 1.2     | API Response Interceptor | Critical | 1hr    | High   | ⏳ TODO |
| 1.3     | User Activity Tracking   | Critical | 30min  | High   | ⏳ TODO |
| 1.4     | Performance Monitors     | Critical | 1hr    | High   | ⏳ TODO |
| 2.1     | Release Health Tracking  | High     | 30min  | Medium | ⏳ TODO |
| 2.2     | Custom Error Classes     | High     | 1hr    | Medium | ⏳ TODO |
| 2.3     | Issue Templates          | High     | 1hr    | Medium | ⏳ TODO |
| 2.4     | Performance Budgets      | High     | 30min  | Medium | ⏳ TODO |
| 2.5     | Env-Specific Config      | High     | 1hr    | Medium | ⏳ TODO |
| 3.1-3.4 | Integrations & Scripts   | Low      | 2hrs   | Low    | ⏳ TODO |

---

## 🚀 Next Steps (In Order)

### Week 1: Critical Path

- [ ] Implement API Response Interceptor (1.2)
- [ ] Add User Activity Tracking (1.3)
- [ ] Add Performance Monitoring (1.4)
- [ ] Test in development environment

### Week 2: Enhanced Features

- [ ] Implement Custom Error Classes (2.2)
- [ ] Set up Environment-Specific Config (2.5)
- [ ] Configure Release Health (2.1)

### Week 3: Polish

- [ ] Set up Slack Integration (3.1)
- [ ] Add GitHub Integration (3.2)
- [ ] Configure Email Alerts (3.3)
- [ ] Deploy to production

---

## 📋 Deploy Checklist

Before deploying to production:

- [ ] All critical recommendations implemented (1.1-1.4)
- [ ] Local testing passed
- [ ] Staging environment verified
- [ ] Team trained on Sentry dashboard
- [ ] Alerts configured
- [ ] On-call rotation set up
- [ ] Documentation updated

---

**Recommendation Status**: 100% Analysis Complete  
**Next Action**: Implement Priority 1 items before production deployment  
