# Performance Monitoring

Lightweight, production-safe instrumentation for Core Web Vitals, slow pages,
and failed requests on the Infamous Freight web app. Designed to catch
regressions early without adding any new paid monitoring tools.

## What gets measured

The root layout mounts `<WebVitalsReporter />`, a client component that uses
Next.js `useReportWebVitals` to capture the Core Web Vitals on every route:

| Metric | What it catches                          | Good   | Needs improvement | Poor   |
| ------ | ---------------------------------------- | ------ | ----------------- | ------ |
| LCP    | Slow largest-contentful-paint            | ≤2.5s  | ≤4.0s             | >4.0s  |
| INP    | Slow/laggy interaction (click, tap, key) | ≤200ms | ≤500ms            | >500ms |
| CLS    | Layout shift / jank                      | ≤0.1   | ≤0.25             | >0.25  |
| TTFB   | Slow server / cold start                 | ≤800ms | ≤1.8s             | >1.8s  |
| FCP    | Slow first paint                         | ≤1.8s  | ≤3.0s             | >3.0s  |
| FID    | Legacy first input delay                 | ≤100ms | ≤300ms            | >300ms |

Each sample is:

1. Reported to **Sentry** as a measurement (existing browser tracing + replay
   integrations already flow through `@sentry/nextjs`).
2. Sent to **`POST /api/metrics/vitals`** via `navigator.sendBeacon` (falls back
   to `fetch({ keepalive: true })`). The route logs one structured JSON line
   per sample with the tag `web-vital` — greppable in Netlify function logs.
3. Buffered in-browser on `window.__ifWebVitals` (last 30 samples) so the
   `/dashboard-health` panel can show a live view of the current session.

Failed client requests and slow operations already flow through Sentry via
`@sentry/nextjs` + `lib/performance.ts` (`trackApiCall`, `performanceMonitor`,
`trackPageLoad`) — those helpers are unchanged.

## Where to see the data

- **Sentry → Performance / Web Vitals** — aggregated p75 by route and release.
  Already wired (`sentry.client.config.ts`, `withSentryConfig` in
  `next.config.mjs`). Alerts should be configured against LCP/INP p75.
- **Netlify → Site → Logs → Functions** — filter for `"tag":"web-vital"`. Each
  line is a single JSON document with `name`, `value`, `rating`, `path`, `env`,
  and optional `release`. `rating:"poor"` lines are emitted at `warn` level.
- **`/dashboard-health`** — live, in-session table showing the p75 and worst
  rating for each metric captured during the current browser session. Useful
  for smoke-testing a deploy preview.

## Validation

### Deploy preview

1. Open the preview URL in Chrome (incognito is fine).
2. Navigate to `/` then `/dashboard-health` — within a few seconds the table
   should populate with `TTFB`, `FCP`, and `LCP` rows.
3. Click around the app for 10–20 seconds — `INP` and `CLS` rows should appear.
4. In Netlify **Site → Logs → Functions**, filter `tag web-vital`. Confirm at
   least one JSON log line per navigation with `env:"deploy-preview"` (or
   `branch-deploy`).
5. Hit `GET /api/metrics/vitals` — should return a small JSON descriptor with
   `"ok":true` and the accepted metric list.
6. If Sentry is configured (`NEXT_PUBLIC_SENTRY_DSN` set), open Sentry →
   Performance → Web Vitals and confirm samples appear on the preview release.

### Production

1. After the release deploys, repeat steps 1–4 on `https://www.infamousfreight.com`.
2. Confirm Netlify function logs show `env:"production"` lines with the current
   release SHA.
3. In Sentry, confirm the new release tag appears under Web Vitals and that
   p75 values are comparable to the prior release.

## Detecting regressions

Three independent signals, any one of which can trip:

1. **Sentry performance alerts** — configure threshold alerts on LCP p75 and
   INP p75 per release (existing Sentry project already receives data). This
   is the primary early-warning signal.
2. **Netlify log queries** — a spike in `"rating":"poor"` log lines per hour
   indicates a regression. Example query fragment:
   `tag="web-vital" rating="poor"`.
3. **Manual sanity check** — open `/dashboard-health` on the deploy preview
   before merging; any column showing `poor` on a normal browsing path is a
   reason to investigate.

For CI-level guardrails, an optional follow-up is to run `lighthouserc.json`
(already present) as a GitHub Actions check against the deploy preview URL and
fail the PR on perf regressions.

## Rollback

The reporter is guarded — all Sentry, beacon, and buffer calls are wrapped in
try/catch and a missing `NEXT_PUBLIC_SENTRY_DSN` already disables Sentry. If
the beacon route must be disabled, add an early `return` in
`apps/web/app/api/metrics/vitals/route.ts` or remove the `<WebVitalsReporter />`
tag from `apps/web/app/layout.tsx`.
