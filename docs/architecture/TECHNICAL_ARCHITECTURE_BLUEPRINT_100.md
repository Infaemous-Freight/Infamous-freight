# Infæmous Freight Technical Architecture Blueprint (100%)

Infæmous Freight at 100% is a freight control tower built on a multi-tenant,
event-driven platform: web and mobile clients talk to an API layer; the API
writes authoritative state to Postgres; events flow through a queue or stream
to workers; tracking is real-time; billing is a first-class system.

## 1) System Map: What talks to what

```text
┌─────────────────────────────── Users ───────────────────────────────┐
│  Shippers (portal/API)   Brokers (ops)    Carriers/Drivers (mobile)  │
└───────────────┬──────────────────┬───────────────────────┬──────────┘
                │                  │                       │
                ▼                  ▼                       ▼
        ┌────────────────────────────────────────────────────────┐
        │                     Edge / Gateway                     │
        │  WAF + Rate limits + TLS + Auth enforcement + Routing │
        └───────────────┬────────────────────────────────────────┘
                        ▼
        ┌────────────────────────────────────────────────────────┐
        │                        API Layer                       │
        │  Auth/RBAC | Tenant isolation | Loads | Shipments |   │
        │  Tracking  | Docs | Billing   | Webhooks | Admin      │
        └───────┬───────────────┬───────────────┬───────────────┘
                │               │               │
                ▼               ▼               ▼
       ┌─────────────┐   ┌─────────────┐   ┌───────────────┐
       │ Postgres     │   │ Redis       │   │ Object Storage │
       │ system of    │   │ cache +     │   │ (POD/Docs/PDF) │
       │ record       │   │ queues      │   └───────────────┘
       └─────┬───────┘   └──────┬──────┘
             │                  │
             ▼                  ▼
     ┌─────────────────────────────────────────────┐
     │                 Worker Fleet                │
     │ AI Matching | Pricing | Alerts | Billing    │
     │ ETAs | Integrations | Document generation   │
     └─────────────────────────────────────────────┘
```

Optional real-time channel:

- Web and mobile clients connect to an SSE or WebSocket service for live
  tracking and notifications.

## 2) Core Product Domains (the truth tables)

Canonical domains that anchor the data model:

- **Tenant / Org**
  - org
  - plan
  - billing settings
- **Identity**
  - users
  - roles
  - sessions/tokens
  - audit log
- **Network**
  - carriers
  - trucks
  - drivers
  - compliance
  - shippers
  - warehouses
  - brokers/dispatch profiles
- **Freight Transaction**
  - loads (demand)
  - offers (marketplace)
  - shipments (execution)
  - events + pings (visibility)
  - documents (POD, RateConf, BOL)
- **Money**
  - invoice
  - payments
  - fees
  - payout ledger

Rule of reality: shipments and invoices must be deterministic and auditable
(no mystery state).

## 3) Event-driven workflow (how automation happens)

### A) Load lifecycle

```text
Load Created
  └─> Event: LOAD.CREATED
        └─> Worker: AI_MATCH
              └─> Offers created (top N carriers)
                    └─> Notify carriers
```

### B) Booking to execution

```text
Carrier Accepts / Broker Books
  └─> Shipment Created
        ├─> Assignment (truck/driver)
        ├─> Event timeline
        └─> Tracking stream begins (pings)
```

### C) Delivery to billing

```text
Delivered + POD
  └─> Event: SHIPMENT.DELIVERED
        └─> Worker: INVOICE.GENERATE
              └─> Invoice issued + platform fee computed
                    └─> Payment flow (Stripe) + settlement
```

Queues and workers keep API response times fast while heavy logic executes
asynchronously.

## 4) Services (logical separation)

Start as a modular monolith, but preserve boundaries so services can split
cleanly:

1. **Auth & Tenant Service**
   - JWT/session issuance
   - tenant context enforcement
   - RBAC policies
2. **Freight Service**
   - load CRUD, offers, booking
   - shipment lifecycle + events
3. **Tracking Service**
   - ping ingestion (high write)
   - live feed (SSE/WebSocket)
   - geofence + ETA
4. **Billing Service**
   - invoices, fees, payouts
   - Stripe PaymentIntent/webhooks
   - ledger-style accounting
5. **Docs Service**
   - uploads + virus scan hooks
   - PDF generation (RateConf/Invoice)
6. **AI/Optimization Workers**
   - matching, scoring, pricing, risk flags
7. **Notification Service**
   - email/SMS/push (Twilio/SendGrid/FCM)
   - in-app notifications

## 5) Multi-tenant isolation (non-negotiable)

Every query must be scoped by `orgId`.

Best practices:

- `orgId` present on every row of every tenant-owned table.
- Composite uniqueness includes `orgId` (for example, `(orgId, email)`).
- DB indexes include `orgId` for performance.

Defense in depth:

- API middleware enforces `orgId` scope.
- Prisma/ORM helpers enforce `orgId` in every call.
- Optional hard backstop: Postgres RLS in later phases.

## 6) Real-time tracking architecture

Tracking has a high-frequency, time-series profile.

### Ingestion

- Mobile app sends ping every 5 to 15 seconds.
- API writes ping to Postgres (or a time-series store in later phases).

### Read pattern

- Shipper/broker reads latest location + last N pings.
- Web UI polls or subscribes via SSE/WebSocket.

### Scaling path

- **Phase 1:** Postgres table + indexes.
- **Phase 2:** partitioned table by time (daily/weekly).
- **Phase 3:** TimescaleDB or stream + hot cache.

Anti-chaos rule: keep `ShipmentEvent` timeline separate from `LocationPing`
telemetry.

## 7) Revenue engine architecture

Treat finance like a bank: deterministic, traceable, reconcilable.

### Ledger approach

- Invoice line items (subtotal).
- Platform fee (bps).
- Total due.
- Payment transactions (provider references).
- Optional payout ledger for carrier settlements.

### Stripe integration

- Create PaymentIntent from invoice.
- Webhook updates payment status.
- Idempotency keys everywhere (webhooks retry).

## 8) Security posture (minimum bar)

- TLS everywhere.
- JWT access tokens + rotation strategy.
- RBAC by role + scoped permissions.
- Rate limiting on auth and ping endpoints.
- Audit logs for sensitive actions (booking, payment, role changes).
- Secrets management (no secrets in repo).
- OWASP basics: Helmet, CORS restrictions, input validation (Zod), CSRF
  strategy for cookie-based sessions.

Uploads are hostile by default: enforce size limits and add a scanning hook.

## 9) Observability (operability)

Operational questions to answer quickly:

- What broke?
- Who is impacted?
- Where is the bottleneck?

Minimum stack:

- Structured logs (`requestId`, `orgId`, `userId`).
- Metrics: latency, queue lag, job failure rate.
- Traces: API → DB → queue → worker.
- Alerting: payment webhook failures, tracking ingestion drops, DB saturation.

## 10) Deployment blueprint (production-ready path)

### Environments

- dev (local docker compose)
- staging
- prod (multi-region later)

### Typical setup

- API + Worker as separate processes.
- Managed Postgres (RDS/Fly/Neon).
- Managed Redis (Upstash/ElastiCache).
- Object storage (S3/R2).
- CDN for static content + docs.

### Scaling

- API scales horizontally behind a load balancer.
- Workers scale by queue depth.
- Tracking can be split into a dedicated hot-path service.

### Reliability

- DB backups + point-in-time recovery.
- Migrations in CI.
- Blue/green deployments.
- Feature flags for risky releases.

## 11) Recommended phase rollout

### Phase 1: Transaction loop

- Loads → Offers → Book → Track → Invoice → Pay.

### Phase 2: Carrier onboarding + compliance

- Onboarding flows, document collection, authority/insurance verification hooks.

### Phase 3: Real Stripe + payouts

- PaymentIntent UI + webhooks + ledger settlement.

### Phase 4: AI upgrades

- Lane pricing model, ETA prediction, carrier reliability scoring.

### Phase 5: Enterprise integrations

- API/EDI pipelines, shipper TMS integrations, SSO.

## The punchline

Infæmous Freight at 100% is not just an app. It is a multi-tenant transaction
engine that:

- coordinates freight movement (shipments),
- captures visibility (tracking),
- automates decisions (AI/ops workers), and
- clears money (billing/fees).

That combination turns software into infrastructure.
