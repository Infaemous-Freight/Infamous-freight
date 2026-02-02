# Sentry Integration Guide for Infamous Freight Web

Complete setup guide for integrating Sentry error tracking and performance monitoring with the Next.js web application.

## 🚨 Critical for Vercel Deployments

**Before deploying to Vercel, read this:**

- 📘 [SENTRY_VERCEL_DEPLOYMENT.md](./SENTRY_VERCEL_DEPLOYMENT.md) - Complete Vercel deployment guide
- 📘 [SENTRY_WIZARD_COMMAND.md](./SENTRY_WIZARD_COMMAND.md) - How to run the Sentry wizard correctly

**Critical fixes already implemented:**

- ✅ Middleware excludes `/monitoring` (Sentry tunnel route)
- ✅ Tunnel route enabled in `next.config.mjs`
- ✅ Monorepo-safe configuration

**Without these fixes:**

- ❌ Sentry events return 401/403 errors
- ❌ Source maps won't upload
- ❌ Stack traces will be minified

## Overview

Sentry provides:

- **Error Tracking**: Capture and monitor runtime errors
- **Performance Monitoring**: Track page load times, API response times, and custom transactions
- **Session Replay**: Watch user interactions leading up to errors
- **Release Tracking**: Monitor which versions have errors
- **Alerting**: Get notified of critical issues

## Setup Steps

### 1. Create Sentry Project

1. Go to [sentry.io](https://sentry.io)
2. Sign in or create an account
3. Click **Projects** → **Create Project**
4. Select platform: **Next.js**
5. Enter project name: `javascript-nextjs`
6. Select team: `infamous-freight-enterprise` (or create it)
7. Click **Create Project**

### 2. Get Your DSN

1. After project creation, you'll see your **DSN** (Data Source Name)
2. Copy the DSN - it looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
3. You'll need this for client-side configuration

### 3. Create Auth Token

1. Go to **Settings** → **Auth Tokens**
2. Click **Create New Token**
3. Select scopes:
   - `project:releases` - for uploading source maps
   - `org:read` - for reading organization data
4. Copy the token - you'll need this for server-side builds

### 4. Configure Environment Variables

Update your `.env.local` file in `apps/web/`:

```bash
# Client-Side (Public)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1

# Server-Side & Build (Private - never commit!)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=infamous-freight-enterprise
SENTRY_PROJECT=javascript-nextjs
```

### 5. Install Dependencies

The Sentry package should already be installed:

```bash
pnpm --filter web add @sentry/nextjs
```

If needed, you can check with:

```bash
pnpm --filter web list | grep sentry
```

### 6. Verify Configuration Files

The following files should be in place:

- `apps/web/sentry.client.config.ts` - Client-side initialization
- `apps/web/sentry.server.config.ts` - Server-side initialization
- `apps/web/sentry.edge.config.ts` - Edge runtime configuration
- `apps/web/instrumentation.ts` - Next.js instrumentation hook
- `apps/web/components/SentryErrorBoundary.tsx` - React error boundary
- `apps/web/next.config.mjs` - Updated with Sentry configuration

### 7. Build Configuration

The `next.config.mjs` is already wrapped with `withSentryConfig()` which:

- Automatically injects the Sentry SDK
- Generates and uploads source maps
- Enables session replay
- Configures performance monitoring

### 8. Test Integration

To verify everything is working:

```bash
# Development
pnpm --filter web dev

# Test client-side errors
# Visit: http://localhost:3000/debug-sentry?errorType=javascript_error
# This will trigger a test error

# Production build
pnpm --filter web build
pnpm --filter web start
```

Then check your Sentry dashboard to see events arrive.

## Configuration Details

### Client-Side Configuration (`sentry.client.config.ts`)

- **Trace Sample Rate**: 10% in production (100% in development)
- **Replay Session Rate**: 10% in production (100% in development)
- **Replay on Error**: 100% - always capture replays when errors occur
- **Breadcrumbs**: 100 in development, 50 in production
- **Session Replay**: Enabled with text/media masking for privacy

### Server-Side Configuration (`sentry.server.config.ts`)

- **Trace Sample Rate**: 10% in production (100% in development)
- **Uncaught Exception Handling**: Automatic
- **Unhandled Rejection Handling**: Automatic
- **Integration**: Uses Node.js integrations

### Error Boundary (`SentryErrorBoundary.tsx`)

React error boundary component that:

- Catches component rendering errors
- Sends them to Sentry with component stack trace
- Shows fallback UI to users
- Preserves error details in development

### Instrumentation Hook (`instrumentation.ts`)

Runs once when Next.js server starts:

- Initializes Sentry for Node.js runtime
- Initializes Sentry for Edge runtime
- Happens before any requests are processed

## Performance Monitoring

Sentry automatically tracks:

- **Page Navigation**: Time to navigate between pages
- **API Requests**: Duration of API calls
- **Database Queries**: If enabled
- **Resource Loading**: CSS, JS, images
- **Web Vitals**: LCP, FID, CLS

To add custom performance tracking:

```typescript
import * as Sentry from "@sentry/nextjs";

// Create a transaction
const transaction = Sentry.startTransaction({
  name: "My Custom Operation",
  op: "custom-op",
});

// Do work...
const span = transaction.startChild({
  op: "db.query",
  description: "SELECT * FROM users",
});

// More work...
span.finish();
transaction.finish();
```

## Error Tracking

Errors are automatically captured from:

- Unhandled JavaScript exceptions
- React error boundaries
- Server-side error handling
- API request failures
- Performance degradations

### Manual Error Capturing

Capture errors programmatically:

```typescript
import { captureException, addBreadcrumb } from "@/src/lib/sentry.client.config";

try {
  // Some operation
} catch (error) {
  captureException(error, {
    shipmentId: shipment.id,
    action: "updateStatus",
  });
}

// Add breadcrumb for context
addBreadcrumb(
  "User clicked submit button",
  "user-action",
  "info"
);
```

## Session Replay

Sentry records user sessions when errors occur (configurable sampling rate).

The replay includes:

- Network requests
- Console logs
- DOM mutations
- User interactions (clicks, scrolls, form input)

Privacy protections:

- Text content is masked
- Images/media are blocked
- Sensitive data patterns are detected

To disable Session Replay:

Edit `sentry.client.config.ts` and remove:

```typescript
new Sentry.Replay({
  maskAllText: true,
  blockAllMedia: true,
}),
```

## Source Maps

Source maps enable stack traces to point to your original TypeScript code instead of minified JavaScript.

Configuration in `next.config.mjs`:

```javascript
sourceMaps: {
  disable: false,
  deleteSourcemapsAfterUpload: true,
}
```

During build, Sentry CLI automatically:

1. Generates source maps
2. Uploads them to Sentry
3. Deletes local source maps from build output

This makes it safe to deploy source maps to Sentry without exposing them to users.

## Troubleshooting

### Events not appearing in Sentry

1. **Check DSN**: Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. **Check network**: Look for failed requests to `sentry.io` in browser DevTools
3. **Check sampling rates**: If rate is 0, no events will be sent
4. **Check filters**: Verify events aren't being filtered in `beforeSend()`

### Too many events

Reduce sample rates:

```typescript
tracesSampleRate: 0.05, // 5% instead of 10%
replaysSessionSampleRate: 0.05,
```

Or filter specific error patterns in `beforeSend()`.

### Source maps not uploading

1. **Check auth token**: Verify `SENTRY_AUTH_TOKEN` is valid
2. **Check permissions**: Token needs `project:releases` scope
3. **Check build output**: Run `pnpm --filter web build` and check for errors
4. **Check logs**: Look for upload errors in build output

### Performance monitoring too noisy

Adjust sample rates or add additional filtering in `beforeSend()`.

## Best Practices

1. **Use environment tags**: Distinguish production from staging issues
2. **Set user context**: Helps identify which users experienced issues
3. **Add breadcrumbs**: Provides context for errors
4. **Use source maps**: Unminified stack traces are much more useful
5. **Monitor performance**: Track Web Vitals and API response times
6. **Review regularly**: Check Sentry dashboard weekly for trends
7. **Set up alerts**: Get notified of critical issues immediately

## Environment Configuration by Stage

### Development

- All traces sampled (100%)
- All replays captured on error (100%)
- Full breadcrumbs (100 max)

### Staging

- 50% trace sampling
- 20% replay sampling
- 75 max breadcrumbs

### Production

- 10% trace sampling
- 10% replay sampling
- 50 max breadcrumbs

Adjust in environment variables:

```bash
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

## Useful Sentry URLs

- **Sentry Dashboard**: <https://sentry.io/>
- **Org Settings**: <https://sentry.io/settings/organizations/infamous-freight-enterprise/>
- **Project Settings**: <https://sentry.io/settings/organizations/infamous-freight-enterprise/projects/javascript-nextjs/>
- **Issues List**: <https://sentry.io/organizations/infamous-freight-enterprise/issues/>
- **Performance Monitoring**: <https://sentry.io/organizations/infamous-freight-enterprise/performance/>

## Key Files

| File                                 | Purpose                                     |
| ------------------------------------ | ------------------------------------------- |
| `sentry.client.config.ts`            | Client-side Sentry initialization           |
| `sentry.server.config.ts`            | Server-side Sentry initialization           |
| `sentry.edge.config.ts`              | Edge runtime Sentry configuration           |
| `instrumentation.ts`                 | Next.js instrumentation hook                |
| `components/SentryErrorBoundary.tsx` | React error boundary component              |
| `next.config.mjs`                    | Next.js config with Sentry wrapper          |
| `.env.local`                         | Environment variables (includes Sentry DSN) |
| `.env.example`                       | Example environment configuration           |

## Next Steps

1. ✅ Complete the setup steps above
2. ✅ Verify events are appearing in Sentry dashboard
3. ✅ Test Session Replay by triggering an error
4. ✅ Review Performance Monitoring metrics
5. ✅ Set up team alerts for critical issues
6. ✅ Configure per-environment settings
7. ✅ Monitor regularly and optimize sample rates

## Support

For questions or issues:

- **Sentry Docs**: <https://docs.sentry.io/platforms/javascript/guides/nextjs/>
- **Sentry Support**: <support@sentry.io>
- **GitHub Issues**: <https://github.com/getsentry/sentry-javascript>
