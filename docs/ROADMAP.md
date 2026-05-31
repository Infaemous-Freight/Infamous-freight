# Product Roadmap

This roadmap describes the current direction for INFÆMOUS FREIGHT. It should be read alongside [`docs/current-status.md`](current-status.md), which remains the source of truth for live runtime readiness.

## Roadmap principles

- Do not imply demo-backed freight workflows are production-ready.
- Keep operator control over AI-assisted workflows.
- Prioritize billing, tracking, intake, and dispatch reliability before broad feature expansion.
- Record launch evidence before public launch approval.
- Treat customer, driver, carrier, billing, and shipment data as sensitive operational data.

## Phase 1 — Production foundation

Status: active / in progress

Focus areas:

- Netlify web deployment path
- Fly.io API deployment path
- same-origin `/api/*` browser proxy
- health and readiness endpoints
- environment validation
- production smoke testing
- Stripe billing and paid-access gating
- public quote/contact intake
- public shipment tracking foundation
- route-readiness banners and gating

Exit criteria:

- public smoke tests pass
- billing verification is recorded when billing is touched
- launch evidence is captured
- known demo-backed routes are clearly labeled
- no unfinished route is presented as production-ready

## Phase 2 — Live operator workflow wiring

Status: next major product hardening phase

Focus areas:

- replace operator dashboard sample data with live API-backed data
- wire load board to production-grade load services
- harden dispatch workflow state transitions
- wire driver roster and driver status services
- improve quote review and dispatch handoff
- add authenticated workflow smoke tests
- improve error, empty, loading, and retry states

Exit criteria:

- `/ops`, `/loads`, `/dispatch`, and `/ops/drivers` no longer depend on demo-backed records
- authenticated smoke coverage exists for core operator routes
- readiness status is updated in `docs/current-status.md`

## Phase 3 — Compliance, accounting, and carrier workflows

Status: planned

Focus areas:

- carrier onboarding workflows
- carrier approval status
- compliance document tracking
- expiration and renewal visibility
- invoice and accounting data hardening
- audit logging and operational history
- exportable operational evidence

Exit criteria:

- compliance records come from validated source systems
- accounting workflows no longer use demo-backed records
- carrier onboarding has clear approval and review controls

## Phase 4 — AI-assisted logistics execution

Status: planned / guarded development

Focus areas:

- AI dispatch assistant
- workflow recommendations
- exception detection
- shipment summary generation
- operational reporting summaries
- notification draft assistance
- predictive routing and planning opportunities

Required guardrails:

- operator approval for material freight decisions
- audit trail for AI-generated recommendations
- no hallucinated shipment, billing, driver, carrier, or customer data
- clear confidence and source indicators where applicable

## Phase 5 — Mobile driver/operator app

Status: planned

Focus areas:

- driver app shell
- mobile load assignment visibility
- driver status updates
- document/photo upload direction
- proof-of-delivery workflow direction
- push notification direction

Exit criteria:

- `/driver-app` is no longer gated as not ready
- mobile workflows are validated with controlled test data
- driver data privacy and access controls are reviewed

## Phase 6 — Enterprise logistics layer

Status: future

Focus areas:

- organization/team management
- enterprise roles and permissions
- reporting dashboards
- audit exports
- procurement-ready security posture
- operational SLAs and support workflows
- larger customer onboarding documentation

## Current priority order

1. Keep `docs/current-status.md` accurate.
2. Complete public production smoke evidence.
3. Validate Stripe billing and webhook flows after billing changes.
4. Replace demo-backed operator data with live API-backed services.
5. Expand authenticated smoke coverage.
6. Add sanitized screenshots for public presentation.
7. Harden AI-assisted workflows only after core freight workflows are reliable.
