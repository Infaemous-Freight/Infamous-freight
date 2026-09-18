# Genesis AI Workforce Specification

Updated 2026-09-17.

## Purpose

Genesis is the AI operating layer for Infamous Freight. It is not only a chat interface. Genesis coordinates specialized AI capabilities around the shared freight record while enforcing tenant isolation, role permissions, human approval, auditability, and explicit execution boundaries.

## AI workforce

### 1. Quote Agent

Responsibilities:
- Parse inbound shipper requests.
- Extract origin, destination, equipment, weight, dimensions, dates, accessorials, and delivery requirements.
- Detect missing quote information.
- Prepare quote assumptions and a proposed rate.
- Create a quote draft only when authorized.

Never silently commit a binding rate.

### 2. Dispatch Agent

Responsibilities:
- Analyze open loads and operational constraints.
- Surface eligible carrier/driver candidates from verified records.
- Prepare assignment recommendations.
- Identify timing, equipment, document, and capacity conflicts.
- Prepare dispatch actions for authorized approval.

Never assign an unverified carrier or execute a binding dispatch without authorization.

### 3. Tracking Agent

Responsibilities:
- Consume shipment events and tracking data.
- Detect delayed, missing, or contradictory events.
- Prioritize exceptions.
- Draft customer and operator notifications.
- Recommend next actions.

Never invent a location or shipment event.

### 4. Carrier Agent

Responsibilities:
- Assist carrier onboarding.
- Organize authority, insurance, and required documents.
- Detect missing or expired records.
- Surface verification status.
- Prepare onboarding follow-ups.

Verification must rely on authoritative sources and configured business rules.

### 5. Compliance Agent

Responsibilities:
- Track operational compliance tasks.
- Monitor document expiration.
- Surface required reviews.
- Distinguish verified regulatory data from AI estimates.
- Escalate unresolved compliance risks.

HOS must not be represented as authoritative without an authoritative ELD/source integration.

### 6. Document Agent

Responsibilities:
- Classify freight documents.
- Extract structured fields.
- Link documents to the correct freight record.
- Detect missing signatures, identifiers, or expected document types.
- Prepare document review queues.

### 7. Billing Agent

Responsibilities:
- Match delivered freight with POD/document evidence.
- Prepare invoice drafts.
- Identify amount/status discrepancies.
- Surface overdue balances.
- Reconcile authorized provider events with the internal financial ledger.

Never move money or issue refunds without authorized execution.

### 8. Customer Agent

Responsibilities:
- Answer shipment, quote, document, and workflow questions.
- Use tenant-scoped freight data.
- Provide clear status and next steps.
- Escalate exceptions that require human intervention.

Never expose another organization’s data.

### 9. Revenue Intelligence Agent

Responsibilities:
- Summarize revenue, costs, margins, invoice aging, and operational trends.
- Identify anomalies and data-quality issues.
- Explain changes using available records.
- Produce owner/operator daily summaries.

Analytics are decision support, not accounting authority.

## Genesis command center

The primary operator experience should support:

- "What needs my attention?"
- "Show me today's exceptions."
- "Prepare the quotes that need review."
- "Which loads need a carrier?"
- "What deliveries are missing PODs?"
- "Show outstanding invoices."
- "Summarize today's operation."

Genesis should return:
1. Current state.
2. Highest-priority operational items.
3. Evidence/data used.
4. Recommended next actions.
5. Actions requiring approval.

## Shared context

Agents should operate on a common freight record:

shipper -> quote -> load -> carrier -> driver -> dispatch -> tracking events -> delivery/POD -> invoice -> payment -> audit.

All AI retrieval must be tenant-scoped and respect the authenticated user's role.

## Execution policy

AI action levels:

### Level 0 — Explain
Free-form explanations and summaries.

### Level 1 — Recommend
AI proposes an action; no state change.

### Level 2 — Prepare
AI creates a draft or task for human review.

### Level 3 — Execute with authorization
AI executes an allowed action after authorization and records an audit event.

### Level 4 — Prohibited autonomous action
No autonomous execution for:
- binding freight commitments without authorization
- unverified carrier approval
- authoritative compliance certification
- unauthorized dispatch
- payments, refunds, or account changes
- fabrication or alteration of operational evidence

## Event-driven architecture

Recommended event inputs:
- quote.created
- quote.updated
- load.created
- carrier.verified
- dispatch.created
- shipment.event.created
- shipment.exception.created
- delivery.pod.received
- invoice.created
- invoice.paid
- invoice.payment_failed
- document.expiring
- compliance.review_required

Each AI task should have:
- organizationId
- actor/user context
- source event
- task type
- status
- risk level
- model/provider metadata
- input/output references
- created/started/completed timestamps
- audit event reference
- human approval state where applicable

## Rollout

Phase 1: Genesis chat + quote intake + operator summary.

Phase 2: quote, tracking, document, and billing assistants.

Phase 3: dispatch and carrier workflow recommendations.

Phase 4: authorized execution with audit trails.

Phase 5: event-driven autonomous workflow orchestration within explicit safety boundaries.

## Production requirement

AI features are not production-ready merely because the model responds. Production readiness requires verified data access, tenant isolation, authorization, observability, rate limiting, failure handling, auditability, and tested rollback behavior.
