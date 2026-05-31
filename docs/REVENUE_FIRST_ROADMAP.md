# Revenue-First Product Roadmap

Date: May 31, 2026

This roadmap ranks Infamous Freight work by revenue impact and production risk. It should guide execution when choosing between new feature work, hardening, and operational polish. Treat it as the product prioritization layer above the detailed API, capability, and launch-readiness documents.

## How to use this roadmap

1. Pull Phase 1 items before Phase 2 or Phase 3 items unless a production incident or security gap overrides the queue.
2. For each item, ship one small branch with API, UI, tests, docs, and rollback notes scoped to that item.
3. Before claiming a capability is launch-ready, update `docs/CAPABILITY_STATUS_MAP.md` with current evidence and keep `docs/API_ROUTE_MAP.md` aligned to implemented routes.
4. If a feature needs production secrets, dashboard configuration, Fly.io access, Stripe access, or Supabase access, keep secret values out of commits and document only the required secret names and command status.

## Executive priority

Ship the smallest paid MVP before expanding into advanced AI, analytics, marketplace, or enterprise automation. The first production goal is paying customers using the platform for quote intake, carrier onboarding, load execution, shipment visibility, POD collection, and billing.

## Ranked recommendations

### 1. Launch a revenue-generating MVP first

**Required MVP capabilities**

- User registration and login.
- Shipper quote request.
- Carrier onboarding.
- Load creation.
- Shipment tracking.
- POD upload.
- Invoice generation.

**Defer until after paid MVP validation**

- AI dispatch.
- Advanced analytics.
- Complex automation.
- Driver scoring.

**Goal:** get paying customers using the platform before broadening the product surface.

### 2. Turn tracking into a competitive advantage

Small brokers often have weak shipment visibility. Treat public tracking as a sales differentiator.

Build or harden:

- Real-time shipment status.
- ETA predictions.
- Automated delay alerts.
- Customer notifications.
- Delivery confirmation.

### 3. Build carrier onboarding immediately

A freight marketplace needs carrier supply before marketplace scale.

Carrier onboarding should collect and verify:

- MC number.
- DOT number.
- Insurance documents.
- W-9 documents.
- Banking information.
- Operating authority.

Use this status flow:

```text
Pending -> Review -> Approved -> Active -> Suspended
```

### 4. Finish tenant isolation

Tenant isolation is a production-critical security requirement. Each organization should only see its own:

- Loads.
- Drivers.
- Invoices.
- Documents.
- Tracking records.

Continue implementing and verifying:

- Supabase JWT verification.
- Organization memberships.
- RLS policies.
- API permission enforcement.

### 5. Build the command center

Make the command center a real operator surface, not only a demo concept.

**Operations**

- Active loads.
- Delayed loads.
- Delivered loads.
- Exceptions.

**Financial**

- Revenue.
- Outstanding invoices.
- Carrier payables.

**Fleet**

- Drivers online.
- Drivers offline.
- Equipment status.

### 6. Create a driver mobile app

Drivers need a daily workflow surface. Prioritize mobile/PWA execution before native-only complexity.

Driver app capabilities:

- Accept load.
- Navigation handoff.
- Status updates.
- POD upload.
- Messaging.
- Hours tracking.
- Settlement history.

### 7. Add payments

Prioritize monetization and cash movement after the MVP flow is usable.

Integrate:

- Stripe.
- ACH.
- QuickPay.
- Carrier payouts.

Future expansion:

- Factoring.
- Fuel cards.
- Instant pay.

### 8. Automate dispatch

Add AI dispatch only after load volume justifies automation.

Match based on:

- Equipment type.
- Location.
- Driver availability.
- Performance history.
- Cost.

### 9. Add compliance features

Enterprise customers will expect compliance depth.

Add:

- ELD integrations.
- HOS tracking.
- Insurance monitoring.
- Safety scores.
- Driver qualification files.

### 10. Build the marketplace

Long-term marketplace model:

- Shippers post freight.
- Carriers bid on freight.
- Drivers accept assignments.
- Infamous Freight collects transaction fees.

## Recommended build order

### Phase 1 — Complete first

- Authentication.
- Organizations.
- Tenant isolation.
- Carrier onboarding.
- Shipment tracking.
- POD upload.
- Billing.

### Phase 2

- Driver mobile app.
- Command center.
- Real-time notifications.
- Dispatch automation.

### Phase 3

- Marketplace.
- AI freight matching.
- QuickPay.
- Enterprise compliance.

## Phase 1 execution backlog

Use this table to convert the revenue MVP into reviewable PRs. The listed files are starting points, not permission for broad rewrites.

| Priority | Work slice | Primary code/docs areas | Acceptance criteria | Required validation |
| ---: | --- | --- | --- | --- |
| 1 | Authentication and organization membership authority | `apps/api/src/app.ts`, `apps/api/src/rbac/`, `apps/web/src/lib/`, `docs/AUTHORIZATION_MIGRATION_PLAN.md` | Protected API routes derive tenant and role from verified Supabase/JWT claims plus membership checks; test-only header fallbacks remain explicitly gated. | `pnpm run env:check:supabase-client`, `pnpm run lint`, `pnpm run test` |
| 2 | Tenant isolation hardening | `apps/api/prisma/`, `apps/api/src/freight-workflow-routes.ts`, `apps/api/src/data-store.ts`, `docs/SUPABASE-HARDENING-RUNBOOK.md` | Loads, drivers, invoices, documents, and tracking queries enforce organization scope; RLS/index changes are documented and reversible. | `pnpm run check:prisma-versions`, `pnpm run prisma:validate`, `pnpm run test` |
| 3 | Carrier onboarding | `apps/api/src/freight-workflow-routes.ts`, `apps/api/prisma/schema.prisma`, `apps/web/src/pages/` or existing carrier portal components | Carriers can submit MC/DOT, insurance, W-9, banking metadata, and authority details; status transitions follow `Pending -> Review -> Approved -> Active -> Suspended`. | `pnpm run lint`, `pnpm run build`, focused API/web tests |
| 4 | Shipment tracking advantage | `apps/api/src/freight-workflow-routes.ts`, `apps/web/src/lib/publicFreightApi.ts`, tracking pages/components | Public and authenticated tracking show current status, delivery confirmation, delay/exception signals, and customer-safe event history without leaking tenant data. | `pnpm run env:check:frontend`, `pnpm run build`, tracking route tests |
| 5 | POD upload and document control | API workflow routes, Prisma models/migrations, document UI, storage runbooks | POD upload creates an auditable delivery/document record; access is tenant-scoped; storage owner, retention, and expiring URL behavior are documented. | `pnpm run prisma:validate`, `pnpm run test`, storage/security docs review |
| 6 | Billing and invoice generation | `apps/api/src/billing.ts`, Stripe webhook modules, billing UI, invoice docs | Invoice generation and billing actions are idempotent, audited, and tied to configured Stripe/customer state without exposing secrets to the browser. | `pnpm run env:check:frontend`, `pnpm run lint`, billing tests |
| 7 | Revenue MVP launch evidence | `docs/LAUNCH_EVIDENCE_LOG.md`, `docs/PRODUCTION_READINESS_VERIFICATION.md`, `docs/CAPABILITY_STATUS_MAP.md` | Evidence captures quote-to-load-to-POD-to-invoice path, liveness/readiness behavior, and rollback notes without secret values. | `pnpm run build`; authenticated operator terminal: `flyctl checks list -a infamous-freight-api`, `curl -i https://infamous-freight-api.fly.dev/api/health/live` |

## Phase 2 execution backlog

| Priority | Work slice | Acceptance criteria |
| ---: | --- | --- |
| 1 | Driver mobile/PWA workflow | Drivers can accept loads, submit status updates, upload PODs, and recover gracefully from mobile/offline failures. |
| 2 | Command center real data | Operations, financial, and fleet widgets use tenant-scoped production endpoints and keep sample/demo data clearly labeled or removed. |
| 3 | Real-time notifications | Delay, exception, delivery, POD, assignment, and billing events trigger tenant-safe browser and customer notifications. |
| 4 | Dispatch automation | Automation remains advisory until dispatchers can review decisions; matching considers equipment, location, availability, performance, and cost. |

## Phase 3 execution backlog

| Priority | Work slice | Acceptance criteria |
| ---: | --- | --- |
| 1 | Marketplace | Shippers post freight, carriers bid, drivers accept assignments, and transaction-fee accounting is auditable. |
| 2 | AI freight matching | AI recommendations are explainable, logged, permission-aware, and gated behind billing/usage controls. |
| 3 | QuickPay and payouts | QuickPay, ACH, and carrier payouts are idempotent, reconciled, and protected by explicit approval/audit controls. |
| 4 | Enterprise compliance | ELD, HOS, insurance monitoring, safety scores, and driver qualification files are tenant-scoped and evidence-backed. |

## Definition of done for revenue-impacting work

- Capability status is updated from planned/beta/docs-only to live only after implementation, tests, and production evidence exist.
- New tenant-scoped data has organization or carrier ownership, indexes for common predicates, and RLS/API enforcement notes.
- New billing, payment, payout, or invoice behavior has idempotency, audit logging, and rollback notes.
- Frontend changes include role-aware navigation/route access where applicable and never expose server-only environment variables.
- Fly.io deployability remains aligned with `PORT=3000`, `http_service.internal_port = 3000`, and the API start command.
- Validation commands and any operator-only follow-up are documented in the PR body.

## Production readiness estimate

| Milestone | Estimated readiness | Notes |
| --- | ---: | --- |
| Current platform | ~80/100 | Continue validating against live evidence and the capability status map. |
| After Phase 1 | ~92/100 | Revenue MVP, tenant isolation, carrier onboarding, tracking, POD, and billing are the launch-critical gap closers. |
| After Phases 1–3 | ~98–100/100 | Enterprise platform posture once marketplace, AI matching, QuickPay, and compliance are production-proven. |

## Target outcome

Completing this roadmap positions Infamous Freight as a combined:

- Freight CRM.
- Dispatch platform.
- Carrier network.
- Driver app.
- Shipment tracking system.
- Billing platform.
- Freight marketplace.

This keeps the brand independent while moving toward the operating depth of larger freight platforms.

## Execution guardrails

- Keep Fly.io deployability intact: API process `node apps/api/dist/src/server.js`, `PORT=3000`, Docker `EXPOSE 3000`, and Fly `internal_port = 3000` must stay aligned.
- Do not weaken tenant, auth, billing, Stripe, or Supabase controls to accelerate feature delivery.
- Prefer small, reversible PRs that each map to one Phase 1 capability or one hardening gap.
- Keep public claims tied to implemented capabilities in `docs/CAPABILITY_STATUS_MAP.md`.
- Capture production impact and rollback notes in every PR that changes auth, data isolation, billing, deployment, database, or operational workflows.
