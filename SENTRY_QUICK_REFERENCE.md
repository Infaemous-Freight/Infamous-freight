# Sentry Quick Reference - Developer Cheat Sheet

## Configuration Files Location

```
apps/web/
├── sentry.client.config.ts          # Client-side setup
├── sentry.server.config.ts          # Server-side setup
├── sentry.edge.config.ts            # Edge runtime setup
├── instrumentation.ts               # Next.js hook
├── components/
│   └── SentryErrorBoundary.tsx       # Error boundary
├── pages/
│   └── debug-sentry.tsx             # Testing page
├── next.config.mjs                  # Sentry wrapper config
├── .env.local                       # Build time secrets
└── .env.example                     # Environment template
```

## Sentry Quick Links

| Link                                                                                             | Purpose          |
| ------------------------------------------------------------------------------------------------ | ---------------- |
| <https://sentry.io>                                                                                | Main dashboard   |
| <https://sentry.io/organizations/infamous-freight-enterprise/>                                     | Organization     |
| <https://sentry.io/organizations/infamous-freight-enterprise/issues/>                              | All issues       |
| <https://sentry.io/settings/organizations/infamous-freight-enterprise/>                            | Org settings     |
| <https://sentry.io/settings/organizations/infamous-freight-enterprise/projects/javascript-nextjs/> | Project settings |

## Environment Setup

### Development

```bash
# .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=1.0
```

### Production

```bash
# .env.production (Vercel/deployment)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_AUTH_TOKEN=your_token_here
```

## Common Code Patterns

### Capture an Error

```typescript
import { captureException } from "@/src/lib/sentry.client.config";

try {
  await updateShipment(id);
} catch (error) {
  captureException(error as Error, {
    shipmentId: id,
    action: "update",
  });
}
```

### Add Breadcrumb

```typescript
import { addBreadcrumb } from "@/src/lib/sentry.client.config";

addBreadcrumb(
  "User clicked shipment details",
  "navigation",
  "info"
);
```

### Send Message

```typescript
import { captureMessage } from "@/src/lib/sentry.client.config";

captureMessage("Payment processing started", "info");
```

### Set User Context

```typescript
import { setUserContext } from "@/src/lib/sentry.client.config";

setUserContext("user-123", "user@example.com");
```

### Clear User Context (on logout)

```typescript
import { clearUserContext } from "@/src/lib/sentry.client.config";

clearUserContext();
```

### Use Error Boundary

```typescript
import SentryErrorBoundary from "@/components/SentryErrorBoundary";

export default function Page() {
  return (
    <SentryErrorBoundary>
      <YourComponent />
    </SentryErrorBoundary>
  );
}
```

### Track Custom Performance

```typescript
import * as Sentry from "@sentry/nextjs";

const transaction = Sentry.startTransaction({
  name: "Payment Processing",
  op: "payment",
});

const span = transaction.startChild({
  op: "stripe.charge",
  description: "Charge credit card",
});

// Do work...

span.finish();
transaction.finish();
```

## Testing Sentry

### Visit Debug Page

```
http://localhost:3000/debug-sentry
```

Click any button to trigger test errors and verify Sentry captures them.

### Check Browser Console

```javascript
// In browser console
window.__SENTRY__ 
// Should have Sentry SDK loaded

// Or test capture
Sentry.captureMessage("Test message");
```

### Verify DSN is Loaded

```javascript
// View current Sentry config
Sentry.getCurrentClient()
```

## Sample Rate Adjustment

Too many events? Reduce sampling:

```typescript
// In sentry.client.config.ts
tracesSampleRate: 0.05, // was 0.1 (50% reduction)
replaysSessionSampleRate: 0.05, // was 0.1
```

Too few events? Increase sampling:

```typescript
tracesSampleRate: 0.5, // was 0.1 (5x increase)
replaysSessionSampleRate: 0.25, // was 0.1
```

## Deployment Checklist

- [ ] `.env.local` has `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `.env.production` has `SENTRY_AUTH_TOKEN`
- [ ] `SENTRY_ORG=infamous-freight-enterprise`
- [ ] `SENTRY_PROJECT=javascript-nextjs`
- [ ] `pnpm build` completes without errors
- [ ] Source maps upload successfully
- [ ] Test error appears in Sentry dashboard

## Troubleshooting

### Events not appearing?

1. Check DSN: `echo $NEXT_PUBLIC_SENTRY_DSN`
2. Check network tab in DevTools for `sentry.io` requests
3. Check sample rate isn't 0
4. Verify not filtered in `beforeSend()`

### Too many events?

1. Lower `tracesSampleRate` to 0.05
2. Add filtering in `beforeSend()`
3. Check for infinite error loops

### Source maps not uploading?

1. Check `SENTRY_AUTH_TOKEN` is valid
2. Check auth token has `project:releases` scope
3. Re-run build: `pnpm build`

### Performance data missing?

1. Check `tracesSampleRate` isn't 0
2. Wait 5 minutes for data to appear
3. Check Browser Tracing integration enabled

## Sample Errors to Trigger

| Button                      | Result                    |
| --------------------------- | ------------------------- |
| Throw JavaScript Error      | Uncaught error            |
| Unhandled Promise Rejection | Promise rejection         |
| Reference Error             | Undefined function        |
| Type Error                  | Undefined property access |
| Range Error                 | Invalid range             |
| Custom Error with Context   | Error with metadata       |
| Simulate Slow API           | Performance transaction   |
| Add Test Breadcrumbs        | Custom breadcrumbs        |
| Send Test Messages          | Multiple messages         |
| Set User Context            | User info                 |

## Key Concepts

**DSN** - Data Source Name (like API key for Sentry)
**Release** - Version of your app (tracked in errors)
**Environment** - dev/staging/production
**Trace** - Individual performance measurement
**Breadcrumb** - Event before error occurred
**Replay** - Video of user session when error happened
**Source Maps** - Maps minified code back to TypeScript

## Common Sentry Fields

| Field         | Example              | Purpose                 |
| ------------- | -------------------- | ----------------------- |
| `environment` | `production`         | Filter/segment errors   |
| `release`     | `1.2.3`              | Track errors by version |
| `tags`        | `{component: "web"}` | Organize/filter errors  |
| `level`       | `error`              | Severity level          |
| `fingerprint` | `custom-key`         | Group similar errors    |

## Health Check

```bash
# Verify Sentry integration
curl -X GET "http://localhost:3000/debug-sentry"

# Should return debug page (if not production)
# Visit and click a test button
# Check https://sentry.io/ for event
```

## Get Help

- **Sentry Docs**: <https://docs.sentry.io/platforms/javascript/guides/nextjs/>
- **Integration Guide**: See [../SENTRY_INTEGRATION_GUIDE.md](../SENTRY_INTEGRATION_GUIDE.md)
- **Checklist**: See [../SENTRY_IMPLEMENTATION_CHECKLIST.md](../SENTRY_IMPLEMENTATION_CHECKLIST.md)
- **Sentry Support**: <https://sentry.io/support/>

---

**Updated**: February 2, 2026
**Status**: Production Ready ✅
