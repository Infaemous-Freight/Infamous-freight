# Infamous Freight — Launch Execution Plan

Updated: 2026-09-17

## Objective

Move Infamous Freight from a feature-rich, partially demo-backed repository to a controlled production launch centered on one measurable money loop:

**shipper lead → quote → human review → load → carrier match → dispatch → tracking → delivery/POD → invoice/payment → revenue**

This plan deliberately separates repository capability from production evidence. A feature is not considered live merely because code exists.

## Current repository findings

- Canonical backend: Express 5 + TypeScript.
- Web: React/Vite/TypeScript/Tailwind.
- Data layer: Prisma/PostgreSQL.
- Payments: Stripe.
- Auth: Supabase/JWT-derived trusted claims.
- Realtime: Socket.IO.
- Hosting configuration: Netlify web + Fly.io API.
- Sentry support is present.
- Genesis AI chat is implemented with policy checks, rate limiting, bounded history, and human-review signals.
- Public quote intake exists.
- Dispatch automation exists in code, but current-status documentation still marks dispatch/load workflows demo-backed.
- Several authenticated operational screens remain demo-backed.
- The repository contains both strong production gates and unfinished/placeholder endpoints. Production approval therefore requires runtime evidence.

## Launch blockers — do these before accepting real freight commitments

### 1. Business model and regulatory classification

Decide and document exactly what Infamous Freight is doing in each transaction:

- motor carrier;
- freight broker;
- dispatch service;
- SaaS/TMS provider;
- marketplace;
- or a combination.

Document which entity contracts with the shipper, which entity contracts with the carrier, who sets/collects freight money, who bears payment/claim risk, and who is legally responsible for arranging transportation.

Do not market or operate a brokerage workflow until required authority, bond/trust, insurance, contracts, and state/business requirements have been independently verified for the actual operating entity.

### 2. Production evidence

Before launch approval, capture evidence for:

- web availability;
- API liveness;
- API readiness;
- database connectivity;
- canonical-domain redirects;
- same-origin /api proxy;
- public quote submission;
- known-safe public tracking lookup;
- authenticated login;
- tenant isolation;
- live load creation;
- assignment/dispatch transition;
- shipment tracking update;
- delivery/POD flow;
- Stripe checkout/customer portal/webhook;
- AI configuration and safe failure behavior.

### 3. Replace demo-backed operator screens

Prioritize these surfaces:

1. /ops
2. /loads
3. /dispatch
4. /ops/drivers
5. /quotes
6. /carriers
7. /invoices
8. /analytics
9. /compliance
10. /accounting

Each must have a documented source of truth. If a screen cannot safely execute the operation, keep it explicitly gated rather than presenting sample records as live data.

### 4. Remove placeholder API responses from live workflows

Audit and replace endpoints returning structurally valid but empty/null placeholders, especially:

- /api/loads/:id
- /api/drivers/:id
- /api/messages
- /api/chat/threads/*
- /api/notifications
- /api/loads/search
- /api/eld/drivers/:driverId/hos

If a capability is not ready, return an explicit not-ready contract or keep the route gated. Do not make a placeholder look like a completed production feature.

### 5. Database migration gate

Run and record:

- prisma validate;
- prisma migrate status;
- production migration review;
- production migration deployment;
- post-migration health/readiness check.

Never treat a migration file existing in Git as proof that production has the migration.

### 6. Billing gate

Verify in the actual Stripe environment:

- price IDs;
- subscription creation;
- customer linkage;
- portal session;
- checkout success/cancel URLs;
- webhook signature verification;
- webhook idempotency;
- entitlement/paywall update;
- one-time AI add-ons if sold.

Never expose secret keys to the browser.

## Genesis AI — production contract

Genesis is the AI operating layer, but it must remain an assistant until every autonomous action has a controlled authorization boundary.

### Public Genesis

Allowed:

- explain services;
- collect quote information;
- explain tracking;
- answer workflow questions;
- collect contact information;
- route requests to humans;
- identify when human review is required.

Blocked without explicit controlled authorization:

- binding freight quotes;
- booking transportation;
- approving carriers;
- changing compliance status;
- dispatching a driver;
- changing billing/account data;
- making claims about regulatory compliance.

### Operational Genesis

For future authenticated automation:

1. read current freight state;
2. score/prioritize;
3. explain recommendation;
4. request/obtain required authorization;
5. perform one bounded action;
6. write an audit event;
7. expose the result to an operator;
8. allow rollback/correction where practical.

Every AI action should carry tenant, user, model/version, input/output correlation, risk level, authorization source, and outcome metadata.

## Carrier onboarding

Production onboarding should verify and track, at minimum:

- legal business identity;
- MC/DOT identifiers where applicable;
- operating authority;
- insurance/document status;
- expiration dates;
- equipment;
- driver association;
- approval state;
- audit history.

Do not represent a carrier as approved solely because a profile exists.

## HOS / compliance

The current driver model contains HOS-related fields, but those fields are not by themselves an ELD or regulatory source of truth.

Until an authoritative integration is live:

- label HOS as unavailable/estimated where appropriate;
- do not claim regulatory compliance;
- do not automatically dispatch based on unverified hours;
- log the source and timestamp of any compliance signal.

## Dispatch operating model

The dispatch board should become the operational control plane:

- load state;
- assigned carrier/driver;
- pickup appointment;
- delivery appointment;
- ETA;
- exceptions;
- HOS risk;
- document/POD status;
- SLA timers;
- alerts;
- human acknowledgement;
- recovery action;
- audit trail.

The dashboard should surface exceptions first, not merely display records.

## Money model

Track the money loop explicitly:

- quote amount;
- carrier cost;
- gross margin;
- platform/dispatch/broker fee where applicable;
- Stripe fees;
- carrier payout;
- invoice status;
- days outstanding;
- collected revenue.

Do not report projected revenue as actual revenue. Production revenue must come from transaction/payment evidence.

## Reliability and deployment

Keep the architecture simple until the core loop is proven:

- Netlify = web;
- Fly.io = API;
- PostgreSQL/Supabase = data/auth;
- Stripe = payments;
- Sentry = observability.

Use the existing health endpoints consistently:

- /api/health/live = liveness;
- /api/health/ready = database readiness;
- /api/health = operator readiness.

Do not introduce another backend framework or hosting layer unless a measured requirement justifies it.

## Security gate

Maintain:

- verified JWT authentication;
- tenant isolation;
- RBAC;
- explicit production CORS;
- CSRF protection where applicable;
- rate limiting;
- Helmet/security headers;
- request IDs;
- audit logging;
- Stripe signature verification;
- secret scanning;
- CodeQL/Scorecard;
- dependency updates.

Treat security workflow failures as evidence gaps until investigated.

## CI/CD gate

Required repository gates:

- lint;
- typecheck;
- Prisma validation;
- build;
- tests.

Deployment gates additionally require credential-backed production checks and recorded evidence.

## Go-live sequence

### Phase A — Freeze the contract
- Freeze public product claims.
- Decide regulatory/business role.
- Freeze canonical domains.
- Freeze money flows.
- Freeze what Genesis may and may not do.

### Phase B — Prove the core loop
- Submit one controlled quote.
- Review it.
- Convert to load.
- Assign carrier.
- Dispatch.
- Track.
- Confirm delivery/POD.
- Invoice.
- Collect payment.
- Verify audit events.

### Phase C — Replace demos
- Convert each operator screen to live data or gate it.
- Remove misleading sample records from production.
- Replace placeholder API responses used by live navigation.

### Phase D — Production hardening
- Apply migrations.
- Verify secrets.
- Verify Stripe.
- Verify domains/DNS.
- Verify health checks.
- Verify monitoring.
- Verify rollback.

### Phase E — Controlled launch
Start with a limited number of real transactions. Measure:

- quote-to-book conversion;
- time to first response;
- loads booked;
- on-time pickup;
- on-time delivery;
- exception rate;
- gross margin;
- payment collection time;
- support contacts;
- AI escalation rate.

## Definition of done

Infamous Freight is launch-ready only when:

- the actual operating entity and legal role are documented;
- required authority/insurance/contracts are verified where applicable;
- the core money loop completes on production infrastructure;
- no live screen disguises demo data as production data;
- migrations are applied and verified;
- Stripe transactions/webhooks are verified;
- tenant isolation is tested;
- Genesis stays inside its authorization boundary;
- rollback and incident procedures are tested;
- evidence is stored with the release/commit.

## Explicit non-goals for the first launch

Do not block the first controlled launch on:

- a native mobile app;
- factoring;
- payroll;
- IFTA;
- full ELD marketplace coverage;
- broker credit scoring;
- broad load-board aggregation;
- every accounting integration.

Those can follow once the core freight transaction loop is proven.
