# Infamous Freight — 10/10 End-to-End Release Standard

Updated 2026-09-17.

## Definition

A 10/10 rating means Infamous Freight is not merely feature-complete in code. It means one authorized production transaction can be demonstrated from shipper intake through operational execution, delivery evidence, payment, reconciliation, audit, and Genesis post-transaction analysis.

A 10/10 score must never be awarded by inference. Each gate requires production evidence.

## Gate matrix

| Gate | Required evidence | Current state |
| --- | --- | --- |
| Canonical deployment | Current `main` commit verified on `www.infamousfreight.com` | BLOCKED: canonical deploy is older |
| API | Production version/commit endpoint matches deployed source | BLOCKED: evidence pending |
| Identity | Verified auth, server-derived tenant, role enforcement | FOUNDATION |
| Quote | Real public request persisted and auditable | FOUNDATION / evidence pending |
| Quote approval | Authorized operator approval + audit | BLOCKED |
| Load creation | Approved quote converts to load with immutable linkage | BLOCKED |
| Carrier verification | Authority, insurance, docs, expiry, approval, audit | BLOCKED |
| Assignment | Eligible carrier/driver + equipment compatibility | BLOCKED |
| Dispatch | Idempotent authorized confirmation + realtime state | BLOCKED |
| Driver execution | Production driver surface receives assignment | BLOCKED |
| Tracking | Real shipment events visible to authorized users | FOUNDATION / evidence pending |
| Exceptions | Severity, owner, SLA, escalation, audit | FOUNDATION |
| Delivery | Delivery state + evidence validation | BLOCKED |
| POD | Upload, verify, retain, audit | BLOCKED |
| Invoice | Derived from delivered freight record | FOUNDATION |
| Payment | Live payment provider transaction | BLOCKED: no live Infamous Freight Stripe account connected |
| Webhook | Signature verification + idempotent event ledger | FOUNDATION |
| Reconciliation | Provider event -> invoice -> internal ledger | BLOCKED |
| Refund/dispute | Ledger and audit treatment | BLOCKED |
| Settlement | Carrier payable state and legal operating model | BLOCKED |
| Accounting | Reconciled revenue, fees, payables, AR | BLOCKED |
| Analytics | Metrics sourced from verified records | BLOCKED |
| Genesis | Tenant-scoped evidence-aware summary/recommendation | FOUNDATION |
| AI execution | Explicit authorization + audit + safe failure | BLOCKED |
| Security | RLS, auth, CSRF/origin, secrets, provider configuration | FOUNDATION / final review pending |
| Backup/rollback | Recovery point and rollback procedure tested | BLOCKED |
| Legal model | Counsel/compliance-approved SaaS/dispatch/broker/carrier structure | BLOCKED |

## Hard blockers

### 1. Production deployment
The canonical Netlify site must run the current `main` source and expose a verifiable application/API version.

### 2. Live payments
A live Stripe account must be explicitly connected for Infamous Freight. Test-mode accounts do not satisfy this gate.

Required payment evidence:
- successful customer payment
- authenticated webhook
- idempotency record
- invoice status transition
- internal ledger entry
- Stripe fee capture
- reconciliation result
- refund path
- dispute path

### 3. Regulated freight role
Before Infamous Freight arranges, brokers, transports, or settles regulated freight, the exact operating model must be approved and the applicable authority, contracts, financial responsibility, insurance, tax, and payment controls must be active.

### 4. Operational golden path
At least one authorized test/production transaction must prove:

quote -> approval -> load -> verified carrier -> assignment -> dispatch -> driver -> tracking -> delivery -> POD -> invoice -> payment -> reconciliation -> analytics -> Genesis.

### 5. Authoritative HOS
Hours-based automated dispatch decisions require an authoritative ELD/HOS source. Stored estimates must remain non-authoritative.

### 6. AI controls
Genesis can explain, collect, recommend, and prepare. Binding freight commitments, carrier approval, dispatch, compliance certification, money movement, refunds, and account changes require explicit authorized execution and audit.

## Release rule

Do not change route readiness from `not_ready` to `live` merely to improve a dashboard score.

A gate becomes live only when its evidence exists.

## Final 10/10 acceptance test

The release is 10/10 only when:

1. Current code is deployed.
2. Production health/version matches the source commit.
3. Tenant isolation passes.
4. A real quote is accepted.
5. A load is created from that quote.
6. A carrier is independently verified.
7. A driver is assigned.
8. Dispatch is confirmed and audited.
9. Tracking events are recorded.
10. Delivery/POD is verified.
11. Invoice is generated.
12. Live payment succeeds.
13. Signed webhook is processed idempotently.
14. Internal ledger reconciles.
15. Accounting metrics update.
16. Genesis explains the completed transaction from verified evidence.
17. Rollback/recovery is verified.
18. Legal/compliance gates are approved.

Until all eighteen are evidenced, the correct rating is less than 10/10.

## Current objective

Move from a strong software foundation to a proven production freight operating system without falsely enabling incomplete or regulated functionality.
