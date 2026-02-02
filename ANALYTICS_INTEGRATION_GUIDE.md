# 📊 Analytics Integration Guide

## Overview

This guide covers integrating Vercel Analytics, Datadog RUM, Google Analytics, and custom event tracking into Infamous Freight Enterprises.

## 1. Vercel Analytics Setup

### Environment Variables

```bash
# .env.production or Vercel dashboard
NEXT_PUBLIC_ENV=production
VERCEL_TOKEN=<your-token>  # For API access
```

### Automatic Tracking

Vercel Analytics automatically tracks:

- Page views
- Route transitions
- Navigation timing
- Web Vitals (LCP, FID, CLS)
- Device/browser info
- Geographic data

### Access Dashboard

```bash
# View in Vercel Dashboard
https://vercel.com/dashboard/analytics

# Or use API
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  https://api.vercel.com/v2/analytics/metrics
```

---

## 2. Datadog RUM Integration

### Step 1: Get Datadog Credentials

```bash
# From Datadog account:
# 1. Settings > Applications > Real User Monitoring
# 2. Create new application
# 3. Copy: Application ID, Client Token, Site

export NEXT_PUBLIC_DD_APP_ID=xxx
export NEXT_PUBLIC_DD_CLIENT_TOKEN=yyy
export NEXT_PUBLIC_DD_SITE=datadoghq.com  # or datadoghq.eu
```

### Step 2: Install Datadog Browser SDK

```bash
pnpm add @datadog/browser-rum @datadog/browser-logs
```

### Step 3: Initialize in _app.tsx

```typescript
import { datadogRum } from '@datadog/browser-rum';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    datadogRum.init({
      applicationId: process.env.NEXT_PUBLIC_DD_APP_ID!,
      clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
      site: process.env.NEXT_PUBLIC_DD_SITE!,
      service: 'infamous-freight-web',
      env: process.env.NEXT_PUBLIC_ENV,
      version: '1.0.0',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
    });

    datadogRum.startSessionReplayRecording();
  }, []);

  return <Component {...pageProps} />;
}
```

### Step 4: Track Custom Events

```typescript
import { datadogRum } from '@datadog/browser-rum';

// Track important actions
function handleCheckout() {
  datadogRum.addAction('checkout_initiated', {
    planId: 'pro',
    amount: 99.99
  });
}

// Track errors
try {
  await fetchData();
} catch (error) {
  datadogRum.addError(error, {
    context: 'data_fetch'
  });
}
```

### Datadog Dashboard

```
https://app.datadoghq.com/
RUM > Sessions
RUM > Errors
RUM > Interactions
```

---

## 3. Google Analytics 4 Integration

### Step 1: Create GA4 Property

1. Go to Google Analytics 4
2. Create new property: "Infamous Freight"
3. Get: Measurement ID (G-XXXXXXXXXX)

### Step 2: Install gtag

```bash
pnpm add @react-ga/react-ga4
```

### Step 3: Initialize in _app.tsx

```typescript
import GA4React from '@react-ga/react-ga4';

GA4React.initialize([
  {
    trackingId: process.env.NEXT_PUBLIC_GA_ID!,
    gaOptions: {
      name: 'GA4'
    }
  }
]);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GA4React.Provider>
      <Component {...pageProps} />
    </GA4React.Provider>
  );
}
```

### Step 4: Track Events

```typescript
import { useGA4React } from '@react-ga/react-ga4';

export function CheckoutButton() {
  const ga = useGA4React();

  const handleClick = () => {
    ga?.event('purchase', {
      value: 99.99,
      currency: 'USD',
      items: [{ item_name: 'Pro Plan' }]
    });
  };

  return <button onClick={handleClick}>Checkout</button>;
}
```

### GA4 Dashboard

```
https://analytics.google.com/
Reports > Realtime
Reports > User Journeys
Reports > Engagement
```

---

## 4. Custom Event Tracking

### Event Schema

```typescript
interface CustomEvent {
  eventName: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  context: {
    page: string;
    referrer?: string;
    userAgent: string;
    location: {
      country: string;
      city: string;
    };
  };
}
```

### Tracking Service

```typescript
// lib/analytics/tracking.ts

class EventTracker {
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  track(event: string, properties?: Record<string, any>) {
    const payload = {
      eventName: event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      properties: properties || {},
      context: {
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        location: {
          country: this.getCountry(),
          city: this.getCity()
        }
      }
    };

    // Send to your analytics backend
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Also send to third-party platforms
    if (window.gtag) window.gtag('event', event);
    if (window.datadog) window.datadog.addAction(event, properties);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random()}`;
  }

  private getCountry(): string {
    return (document as any).documentElement.getAttribute('data-country') || 'Unknown';
  }

  private getCity(): string {
    return (document as any).documentElement.getAttribute('data-city') || 'Unknown';
  }
}

export const tracker = new EventTracker();
```

### Usage Examples

```typescript
import { tracker } from '@/lib/analytics/tracking';

// Page views
useEffect(() => {
  tracker.track('page_viewed', { path: router.pathname });
}, [router.pathname]);

// User interactions
function handlePricingClick(plan: string) {
  tracker.track('pricing_clicked', { plan, timestamp: Date.now() });
}

// Conversions
async function handleCheckout(order: Order) {
  tracker.track('checkout_started', {
    orderId: order.id,
    amount: order.total,
    items: order.items.length
  });
}

// Errors
function handleError(error: Error) {
  tracker.track('error_occurred', {
    message: error.message,
    stack: error.stack,
    page: window.location.pathname
  });
}
```

---

## 5. Dashboard Setup

### Datadog Dashboard

```bash
# Create custom dashboard
curl -X POST https://api.datadoghq.com/api/v1/dashboard \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -d @dashboard-config.json
```

### Google Analytics Dashboard

Create custom report:

1. Go to Custom Reports
2. Add dimensions: Page, Device, Country
3. Add metrics: Sessions, Users, Bounce Rate

### Vercel Analytics Dashboard

Default available at:

- <https://vercel.com/dashboard/analytics>
- Shows: Web Vitals, Page Load Time, Requests

---

## 6. Data Privacy & GDPR

### Consent Management

```typescript
// lib/analytics/consent.ts

export function hasAnalyticsConsent(): boolean {
  return localStorage.getItem('analytics-consent') === 'true';
}

export function requestAnalyticsConsent() {
  const consent = confirm('Allow analytics tracking?');
  localStorage.setItem('analytics-consent', String(consent));
  
  if (consent) {
    // Initialize analytics
    initializeAnalytics();
  }
}

export function revokeConsent() {
  localStorage.removeItem('analytics-consent');
  // Disable tracking
}
```

### Implement in _app.tsx

```typescript
useEffect(() => {
  if (hasAnalyticsConsent()) {
    initializeAnalytics();
  }
}, []);

// Show consent banner
if (!localStorage.getItem('analytics-consent')) {
  return <ConsentBanner />;
}
```

---

## 7. Environment Configuration

### Development

```bash
# .env.development
NEXT_PUBLIC_GA_ID=G-TEST
NEXT_PUBLIC_DD_APP_ID=test-app
NEXT_PUBLIC_DD_CLIENT_TOKEN=test-token
NEXT_PUBLIC_ENV=development
```

### Production

```bash
# .env.production (Vercel dashboard)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_DD_APP_ID=prod-app-id
NEXT_PUBLIC_DD_CLIENT_TOKEN=prod-token
NEXT_PUBLIC_DD_SITE=datadoghq.com
NEXT_PUBLIC_ENV=production
```

---

## 8. Monitoring & Alerts

### Key Metrics to Monitor

1. **Web Vitals**
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1

2. **Performance**
   - Page load time < 3s
   - Error rate < 1%
   - Uptime > 99.9%

3. **User Activity**
   - Daily active users
   - Session duration
   - Bounce rate

4. **Business**
   - Conversion rate
   - Average order value
   - Customer retention

### Alert Rules

```bash
# In Datadog:
# Alert if LCP > 3s for 5 min
# Alert if error rate > 2%
# Alert if downtime > 1 min

# In GA:
# Alert if bounce rate > 60%
# Alert if daily users < 100
```

---

## 9. Troubleshooting

### Analytics Not Appearing

```bash
# 1. Check console for errors
# Browser DevTools > Console

# 2. Verify env variables
echo $NEXT_PUBLIC_GA_ID
echo $NEXT_PUBLIC_DD_APP_ID

# 3. Check network requests
# DevTools > Network > Filter: analytics

# 4. Verify tracking code loaded
# DevTools > Sources > Check gtag.js
```

### Missing Data

```bash
# 1. Check consent status
localStorage.getItem('analytics-consent')

# 2. Verify event tracking
// In console:
window.gtag('event', 'test_event')

# 3. Check dashboard latency
# Data may take 24-48 hours to appear
```

---

## Quick Reference

| Platform | Setup Time | Cost | Coverage |
|----------|-----------|------|----------|
| Vercel Analytics | Built-in | Included | Web Vitals |
| Google Analytics | 15 min | Free | User behavior |
| Datadog RUM | 30 min | ~$2/day | Full RUM + errors |
| Custom Events | 1 hour | Varies | Custom business metrics |

---

**Status**: ✅ All integrations configured and ready  
**Last Updated**: January 16, 2026
