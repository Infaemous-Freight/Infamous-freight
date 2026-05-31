# Current status

Updated 2026-05-31.

## Active runtime

- `apps/api` is the active backend runtime.
- Fly.io, Docker, and the API server are aligned on port `3000`.
- Netlify serves the web app and proxies same-origin `/api/*` browser traffic to Fly.io.
- Stripe billing/paywall activation is production-enabled for billing routes.
- Public demo freight records are disabled by default in production builds. Set `VITE_ENABLE_DEMO_DATA=true` only for controlled demos or sales sandboxes.

## Runtime readiness snapshot

| Area | Status | Notes |
| --- | --- | --- |
| Web deployment | Live path active | Netlify serves the React/Vite app. |
| API deployment | Live path active | Fly.io hosts the Express API behind the Netlify `/api/*` proxy. |
| Billing/paywall | Live | Stripe Checkout, Customer Portal, webhook handling, and paid-access gating are production-enabled. |
| Public shipment tracking | Foundation active / needs known-safe positive record validation | Malformed/unknown tracking behavior is covered; production positive lookup requires a known-safe public tracking number. |
| Public quote/contact intake | Active path / requires production evidence capture | Public intake should be verified after every deploy and recorded in launch evidence. |
| Operator dashboard | Demo-backed | Live operations data wiring remains in progress. |
| Dispatch/load workflows | Demo-backed | Do not use as the production source of dispatch execution until live wiring is complete. |
| Mobile app | Planned / not ready | `/driver-app` remains gated. |
| AI dispatch automation | In progress | AI features require freight-domain guardrails, auditability, and operator control before live use. |

## Still being hardened

- Some operator-facing views still contain sample/demo-backed data.
- The main dashboard sample data should be replaced with live API-backed services.
- Unfinished authenticated routes should remain explicitly gated when they are not production-ready.
- Positive public tracking lookup should be smoke-tested with a known-safe production tracking number before launch approval.
- Stripe billing flows require controlled production account/customer verification after billing changes.
- Pending database migration review/application and launch evidence capture are still required for public launch approval.

## Authenticated route readiness

Source of truth in code: `apps/web/src/lib/routeReadiness.ts`.

| Route | Readiness | Notes |
| --- | --- | --- |
| `/ops` | demo-backed | Dashboard is demo-backed while live operations data wiring is in progress. |
| `/loads` | demo-backed | Load board records are demo-backed. |
| `/dispatch` | demo-backed | Dispatch workflow is demo-backed. |
| `/ops/drivers` | demo-backed | Driver management view is demo-backed. |
| `/invoices` | demo-backed | Invoice management view is demo-backed. |
| `/analytics` | demo-backed | Metrics are demo-backed and not final production analytics. |
| `/compliance` | demo-backed | Compliance records are demo-backed and require source-system validation. |
| `/settings` | demo-backed | Settings contains mixed readiness surfaces and is not fully live. |
| `/settings/billing` | live | Billing/paywall activation is production-enabled. |
| `/billing` | live | Billing/paywall activation is production-enabled. |
| `/carriers` | demo-backed | Carrier onboarding and approval are demo-backed. |
| `/accounting` | demo-backed | Accounting workflows are demo-backed. |
| `/quotes` | demo-backed | Internal quote workflow is demo-backed. |
| `/messages` | not ready | Route is explicitly gated in-app and unavailable for live operations. |
| `/driver-app` | not ready | Route is explicitly gated in-app and unavailable for live operations. |

## Verification

Run repository gates:

- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run prisma:validate`
- `pnpm run build`
- `pnpm run test`

Run production readiness checks when preparing a launch or production release:

- `pnpm run env:check:strict`
- `pnpm run production:preflight`
- `pnpm run production:smoke-test`
- `pnpm run billing:verify-live` when billing code or Stripe configuration changes
- `pnpm run production:capture-netlify-evidence` after Netlify launch checks

## Launch approval rule

Do not approve a public launch from this document alone. Launch approval still requires credential-backed production checks, pending database migration review/application, Stripe evidence when billing is touched, and evidence recorded in the launch readiness documents.
