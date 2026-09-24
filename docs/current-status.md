# Current status

Updated 2026-09-24.

## Production truth

- The canonical Netlify site is `https://www.infamousfreight.com`.
- The currently verified Netlify production deploy remains the June 3, 2026 deploy `6a1ff804e5f8190008d78326`, built from commit `5ec0b815d41929d4af5f4208185ad6e81da62cc3`; the September `main` release is still awaiting verified production deployment.
- September `main` changes are **not yet proven live** on the canonical site. The connected Netlify deployment tool returns an operator-side CLI command rather than executing the source upload in this environment.
- The connected Stripe accounts are test-mode only; no live Infamous Freight Stripe account is available through the current connection. Do not represent Stripe live payments as verified.
- Supabase production project `wnaievjffghrztjuvutp` has the freight/Stripe schema and RLS enabled. A security hardening migration for `public.set_updated_at()` was applied on 2026-09-17/18 and is now tracked in the repository migration set.
- Supabase security advisory checks still report Stripe-managed tables with RLS/no policies as informational and Supabase Auth leaked-password protection as disabled. These require provider-console/configuration review before final security sign-off.

## AI runtime

- Genesis now has a tenant-scoped Gemini reasoning adapter on the feature branch and an authenticated `POST /api/genesis/chat` API contract.
- Gemini credentials are server-side only. The integration does not grant Gemini direct Stripe, dispatch, billing, or database mutation authority.
- The Gemini runtime is not production-verified until `GEMINI_API_KEY` is configured on the Fly API runtime and the endpoint passes authenticated smoke testing.

## Active runtime

- `apps/api` is the active backend runtime.
- Fly.io, Docker, and the API server are aligned on port `3000`.
- Netlify serves the web app and proxies same-origin `/api/*` browser traffic to Fly.io.
- Billing/paywall code paths are implemented, but live Stripe account/payment verification remains blocked by the absence of a connected live account.
- Public demo freight records are disabled by default in production builds. Set `VITE_ENABLE_DEMO_DATA=true` only for controlled demos or sales sandboxes.


## End-to-end transaction spine

The repository now contains workflow/data-store primitives for quote-to-load conversion, load assignments, dispatch confirmation, shipment tracking, delivery verification, carrier payment status, operational metrics, and load-board status updates. These primitives are not considered production-live until the corresponding authenticated UI, realtime events, authorization, audit evidence, and external-provider paths are verified together.

The release target is:

quote request -> quote approval -> load -> verified carrier -> assignment -> dispatch -> driver -> tracking -> delivery/POD -> invoice -> payment -> reconciliation -> analytics -> Genesis optimization.


## Runtime readiness snapshot

| Area | Status | Notes |
| --- | --- | --- |
| Web deployment | **Stale production** | Canonical site is live, but verified deploy predates current September code. |
| API deployment | Live path active | Fly.io hosts the Express API behind the Netlify `/api/*` proxy; current production evidence still needs capture. |
| Billing/paywall | **Test/implementation ready** | Stripe billing code exists, but live account and end-to-end payment evidence are not verified. |
| Public shipment tracking | Foundation active / needs positive record validation | Malformed/unknown tracking behavior is covered; production positive lookup requires a known-safe public tracking number. |
| Public quote/contact intake | Active path / requires production evidence capture | Public intake should be verified after the next production deploy. |
| Operator dashboard | Gated | Live operations data wiring remains incomplete. |
| Dispatch/load workflows | Partially live | Loads and driver roster use tenant-scoped API data; dispatch execution remains gated. |
| Mobile app | Planned / not ready | `/driver-app` remains gated. |
| AI dispatch automation | In progress | Genesis requires freight-domain guardrails, auditability, and operator control before live execution. |

## Authenticated route readiness

Source of truth in code: `apps/web/src/lib/routeReadiness.ts`.

| Route | Readiness | Notes |
| --- | --- | --- |
| `/ops` | gated | Live operations dashboard not complete. |
| `/loads` | live | Tenant-scoped API data; external load-board feeds remain disconnected. |
| `/dispatch` | gated | Dispatch workflow is not yet production-safe. |
| `/ops/drivers` | live | Tenant-scoped API data; HOS remains non-authoritative without an ELD integration. |
| `/invoices` | live | Tenant-scoped invoice API; Stripe collection/reconciliation still requires production verification. |
| `/analytics` | gated | Production analytics not complete. |
| `/compliance` | gated | Compliance source-system integration not complete. |
| `/settings` | gated | Mixed readiness surfaces. |
| `/settings/billing` | gated pending live Stripe verification | Billing UI exists; live payment verification is outstanding. |
| `/billing` | gated pending live Stripe verification | Billing UI exists; live payment verification is outstanding. |
| `/carriers` | gated | Carrier onboarding/approval not fully live. |
| `/accounting` | gated | Production accounting/reconciliation not complete. |
| `/quotes` | gated | Internal quote workflow not fully live. |
| `/messages` | gated | Persistent operational messaging not complete. |
| `/driver-app` | not ready | Explicitly unavailable for live operations. |

## Launch blockers

1. Deploy current `main` to Netlify and verify the resulting production commit.
2. Connect a live Stripe account and verify Checkout, Billing, webhooks, refunds/disputes, and reconciliation.
3. Complete/verify production DB migration state and launch evidence.
4. Complete carrier onboarding/authority/insurance verification and contracts for the chosen legal operating model.
5. Complete authoritative HOS/ELD integration before automated dispatch decisions based on driver hours.
6. Complete live dispatch, realtime shipment events, POD, invoice, accounting, and audit workflows.
7. Keep Genesis bounded: it may explain, collect, recommend, and prepare; binding freight, carrier, dispatch, billing, or account actions require authorized execution.
