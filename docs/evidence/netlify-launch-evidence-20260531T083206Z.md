# Netlify Launch Evidence

Captured at: 20260531T083206Z

## Scope

This evidence captured the public customer path for Infamous Freight after a Netlify deploy. It checked the canonical web host, apex redirect behavior, proxied API health, quote intake preflight, invalid tracking validation, optional positive tracking validation, security headers, and the active Netlify request identifier. No production quote or shipment record was created by this check.

## Results

| Check | Result |
| --- | --- |
| Canonical host | HTTP 200 for https://www.infamousfreight.com |
| Apex redirect | https://infamousfreight.com resolved to https://www.infamousfreight.com/ |
| Proxied API health | HTTP 200, content type application/json; charset=utf-8 |
| Public quote preflight | HTTP 204 |
| Invalid tracking lookup | HTTP 400 |
| Positive tracking lookup | skipped for not configured |
| Netlify request identifier | 01KSYJJTBWQEW7FHSF9RDT6R7H |
| Cache status | "Netlify Edge"; fwd=stale |

## Security Headers

| Header | Value |
| --- | --- |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |
| Content-Security-Policy | default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://www.google-analytics.com https://stats.g.doubleclick.net; connect-src 'self' https://infamous-freight-api.fly.dev https://api.infamousfreight.com https://api.stripe.com https://*.sentry.io https://*.ingest.sentry.io https://ingesteer.services-prod.nsvcs.net https://www.google-analytics.com https://www.googletagmanager.com; frame-src https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; worker-src 'self'; upgrade-insecure-requests |
| X-Frame-Options | SAMEORIGIN |

## API Health Body

```json
{"status":"ok","timestamp":"2026-05-31T08:32:07.098Z","services":{"database":"connected"}}
```

## Invalid Tracking Body

```json
{"error":"invalid_tracking_number","message":"Tracking number must use the IF-##### format.","requestId":"5ff65c2f-6725-4248-bd52-1f9f7eb174a3"}
```

## Positive Tracking Summary

```json
{
  "skipped": true,
  "reason": "Set PUBLIC_VALID_TRACKING_NUMBER or PUBLIC_VALID_SHIPMENT_URL to validate a real production tracking record."
}
```

## Expected Follow-Up

Operations should review public quote and contact leads in Netlify Forms first, then match API-backed quote records by tracking reference when a reference was returned. To complete positive public tracking validation, rerun this command with `PUBLIC_VALID_TRACKING_NUMBER=IF-#####` or `PUBLIC_VALID_SHIPMENT_URL=...` for a known-safe production shipment record. If the proxied API health result is not JSON, quote preflight does not return 204, or a configured positive tracking lookup does not return HTTP 200, the Netlify proxy, Fly API route, and production shipment record should be investigated before launch traffic is increased.
