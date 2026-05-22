# Netlify Launch Evidence

Captured at: 20260522T022608Z

## Scope

This evidence captured the public customer path for Infamous Freight after a Netlify deploy. It checked the canonical web host, apex redirect behavior, proxied API health, quote intake preflight, invalid tracking validation, security headers, and the active Netlify request identifier. No production quote or shipment record was created by this check.

## Results

| Check | Result |
| --- | --- |
| Canonical host | HTTP 200 for https://www.infamousfreight.com |
| Apex redirect | https://infamousfreight.com resolved to https://www.infamousfreight.com/ |
| Proxied API health | HTTP 200, content type application/json; charset=utf-8 |
| Public quote preflight | HTTP 204 |
| Invalid tracking lookup | HTTP 400 |
| Netlify request identifier | 01KS6R281CEP00Z3GGKBSPQA0P |
| Cache status | "Netlify Edge"; fwd=stale |

## Security Headers

| Header | Value |
| --- | --- |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |
| Content-Security-Policy | default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://*.supabase.co https://www.google-analytics.com https://stats.g.doubleclick.net; connect-src 'self' https://infamous-freight-api.fly.dev https://api.infamousfreight.com https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io https://*.ingest.sentry.io https://ingesteer.services-prod.nsvcs.net https://www.google-analytics.com https://www.googletagmanager.com; frame-src https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; worker-src 'self' blob:; upgrade-insecure-requests |
| X-Frame-Options | SAMEORIGIN |

## API Health Body

```json
{"status":"ok","timestamp":"2026-05-22T02:26:09.357Z","services":{"database":"connected"}}
```

## Invalid Tracking Body

```json
{"error":"invalid_tracking_number","message":"Tracking number must use the IF-##### format.","requestId":"6c9ff5eb-01d2-454a-886f-0ef964d799d9"}
```

## Expected Follow-Up

Operations should review public quote and contact leads in Netlify Forms first, then match API-backed quote records by tracking reference when a reference was returned. If the proxied API health result is not JSON, or if quote preflight does not return 204, the Netlify proxy and Fly API route should be investigated before launch traffic is increased.
