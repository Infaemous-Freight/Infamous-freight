# Infamous Freight Blueprint Execution Checklist

This checklist translates the end-to-end brokerage blueprint into production execution tasks.

## Phase 0 — Compliance and Legal Readiness (No Freight Before This)

- [ ] Form legal entity and obtain EIN.
- [ ] Open dedicated business banking.
- [ ] File FMCSA broker authority and obtain MC number.
- [ ] File BOC-3 process agent designation.
- [ ] Secure BMC-84 surety bond or BMC-85 trust ($75,000).
- [ ] Complete UCR registration (if applicable).
- [ ] Finalize shipper-broker agreement with transportation counsel.
- [ ] Finalize broker-carrier agreement with no re-brokering clause.
- [ ] Define claims and accessorial policies (detention, layover, TONU, etc).

## Phase 1 — Core Freight Operating System (Brokerage First)

- [ ] Build shipper intake flow with required freight fields.
- [ ] Build quote workflow with lane + risk checks.
- [ ] Build carrier sourcing and vetting workflow.
- [ ] Require signed rate confirmation before dispatch.
- [ ] Implement pickup/in-transit/delivery update SOPs.
- [ ] Require POD before invoice release.
- [ ] Implement AR/AP workflow and collections cadence.

## Phase 2 — Platform Hardening (Engineering Guardrails)

- [ ] Enforce authentication on all protected API routes.
- [ ] Enforce org tenant scoping (`tenantId`) in all data access.
- [ ] Enforce RBAC checks for dispatch, billing, and admin actions.
- [ ] Log AI outputs to `AiDecisionLog`.
- [ ] Ensure billing idempotency with `BillingEvent`.
- [ ] Keep config/env loading centralized and validated.
- [ ] Ensure Prisma client generation before builds/runtime.

## Phase 3 — Revenue and Product Expansion

- [ ] Start with shipment-fee revenue only.
- [ ] Launch shipper paid plans after repeat volume.
- [ ] Launch driver premium tools after free driver value is proven.
- [ ] Launch partner marketplace/sponsorship placements after user volume.
- [ ] Add enterprise/API monetization only after operational consistency.

## Phase 4 — Metrics and Operating Discipline

- [ ] Weekly dashboard: loads, revenue, carrier cost, gross margin %.
- [ ] Track service KPIs: on-time pickup/delivery, check-call compliance.
- [ ] Track financial KPIs: AR aging, DSO, invoice cycle time.
- [ ] Track risk KPIs: claims ratio, carrier falloff, concentration.
- [ ] Conduct post-load review for exception handling and process updates.

## Immediate 30-Day Execution Targets

- [ ] Pick lane/equipment niche and 3–5 target regions.
- [ ] Build 100 verified carriers for initial bench.
- [ ] Start daily outbound shipper prospecting.
- [ ] Move first loads only with fully verified carriers.
- [ ] Publish and enforce SOPs for quote → cover → track → POD → invoice.

## CI/Validation Commands

- `pnpm -w prisma generate`
- `pnpm -w test -- --runInBand`
- `pnpm -w build`
- `pnpm run tools:verify`
