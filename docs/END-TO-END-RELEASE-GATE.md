# End-to-End Release Gate

Updated 2026-09-17.

## Objective

Prove one complete Infamous Freight transaction from shipper intake through money reconciliation, with Genesis operating as bounded decision support.

## Golden path

1. Public shipper submits quote request.
2. Quote is persisted with a tenant-safe identity and auditable status.
3. Authorized operator reviews and approves the quote.
4. Approved quote converts into a load without losing source linkage.
5. Carrier eligibility is verified using configured authority, insurance, document, and business rules.
6. Authorized operator assigns an eligible carrier/driver.
7. Dispatch is confirmed and an audit event is written.
8. Driver receives the assignment through the production driver surface.
9. Shipment events and tracking updates are recorded.
10. Exceptions are detected and routed to an authorized operator.
11. Delivery is completed and POD is uploaded/verified.
12. Invoice is generated from the delivered freight record.
13. Customer payment is processed through the configured live payment provider.
14. Provider webhook is authenticated, idempotently recorded, and reconciled to the internal ledger.
15. Carrier/service settlement status is recorded.
16. Operational and financial metrics update from verified records.
17. Genesis can summarize the completed transaction and explain evidence used.

## Acceptance criteria

### Identity and tenancy
- Every authenticated operation resolves organization/tenant context server-side.
- Client-provided tenant identifiers cannot override authenticated tenancy.
- Cross-tenant reads and writes return controlled authorization/not-found responses.
- Audit events contain actor, organization, entity, action, request ID, and timestamp.

### Quote and load
- Required origin, destination, equipment, weight, timing, and contact data are validated.
- Quote status transitions are explicit and auditable.
- Load creation preserves quote/request linkage.
- Pricing inputs and approved values are immutable after commitment except through an authorized amendment workflow.

### Carrier and dispatch
- Carrier authority/insurance/document state is verified before eligibility.
- Assignment requires an eligible carrier and compatible equipment.
- Dispatch confirmation requires the required role/permission.
- Dispatch execution is idempotent.
- Estimated HOS is never treated as authoritative.
- ELD-backed HOS is required before hours-based automated dispatch decisions.

### Tracking and delivery
- Shipment events are append-only or otherwise auditable.
- Unknown/invalid tracking identifiers do not expose tenant freight data.
- Public tracking exposes only explicitly public fields.
- Delivery requires the configured POD/evidence checks.
- Exceptions have an owner, severity, status, and audit trail.

### Billing and reconciliation
- Invoice amount derives from an approved freight record.
- Live payment provider events are signature-verified.
- Webhook processing is idempotent.
- Payment status is not trusted from the browser.
- Refunds and disputes create ledger/audit events.
- Internal invoice/payment state can be reconciled against provider events.

### Genesis
- Genesis retrieval is tenant-scoped.
- AI outputs identify uncertainty and source data when material.
- AI cannot silently commit binding freight, approve an unverified carrier, certify compliance, dispatch, move money, refund, or change accounts.
- Authorized execution produces an audit event.
- AI failures degrade safely to human workflow.

## Required evidence before declaring the golden path live

- Current main commit deployed to canonical web production.
- API version/commit verified through production health/version endpoint.
- Production database migration status captured.
- Authenticated tenant-isolation test evidence captured.
- Quote positive-path evidence captured.
- Quote-to-load conversion evidence captured.
- Carrier verification evidence captured.
- Dispatch confirmation evidence captured.
- Tracking event evidence captured.
- POD/delivery evidence captured.
- Invoice evidence captured.
- Live payment and signed webhook evidence captured.
- Reconciliation evidence captured.
- Genesis evidence captured.
- Rollback procedure tested or documented with a verified recovery point.

## Explicit non-goals

Passing this document does not by itself establish legal authority to broker, arrange, transport, or settle freight. The selected operating model must separately satisfy applicable contracts, authority, financial responsibility, insurance, tax, and payment requirements.

## Release rule

Do not mark the entire product "live" because one route or module works. The product is end-to-end live only when the golden path is demonstrated with real production configuration and the evidence above.
