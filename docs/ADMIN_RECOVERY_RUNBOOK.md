# Admin Recovery Runbook

Admin recovery prevents production support from turning into direct database surgery. Every critical operational state must be inspectable and recoverable through admin tooling or a controlled, audited procedure.

## Required Admin Capabilities

| Capability | Required Before Private Beta | Required Before Paid Beta | Required Before Public Launch |
|---|---:|---:|---:|
| Find user by email/ID | Yes | Yes | Yes |
| Disable or suspend user | Yes | Yes | Yes |
| Inspect user role and access | Yes | Yes | Yes |
| Inspect shipment/load | Yes | Yes | Yes |
| Update shipment/load status safely | Yes | Yes | Yes |
| Inspect assignment state | Yes | Yes | Yes |
| Inspect payment/billing state | No | Yes | Yes |
| Resend critical notification if supported | No | Yes | Yes |
| View audit log | Yes | Yes | Yes |
| Document manual correction | Yes | Yes | Yes |

## Recovery Principles

- Do not bypass authorization or audit logging.
- Do not delete records to hide errors.
- Prefer reversible status changes over destructive edits.
- Capture before/after values for manual corrections.
- Tie every correction to a support ticket, incident, or blocker ID.
- Treat payment providers and document storage providers as source systems where applicable.

## User Recovery

Use when a user cannot access the platform, has incorrect access, or must be disabled.

Checklist:

- [ ] Admin can search user by email
- [ ] Admin can search user by ID
- [ ] Admin can inspect role
- [ ] Admin can inspect account status
- [ ] Admin can disable/suspend user
- [ ] Admin can restore access if policy allows
- [ ] Admin action creates audit entry
- [ ] Evidence logged

## Role and Permission Recovery

Use when a user has wrong permissions or unauthorized access is suspected.

Checklist:

- [ ] Current role recorded
- [ ] Expected role confirmed
- [ ] Access boundaries checked against API behavior
- [ ] Role corrected through admin-approved path
- [ ] User session/token refresh behavior considered
- [ ] Audit entry created
- [ ] Evidence logged

## Shipment/Load Recovery

Use when a shipment/load is stuck, assigned incorrectly, has wrong status, or cannot be closed.

Checklist:

- [ ] Shipment/load found by ID/reference
- [ ] Current status recorded
- [ ] Expected status identified
- [ ] Assignment state inspected
- [ ] Required documents inspected
- [ ] Safe status transition performed or documented workaround used
- [ ] Customer/carrier-facing impact assessed
- [ ] Audit entry created
- [ ] Evidence logged

## Assignment Recovery

Use when a load is assigned to the wrong carrier/driver/vendor or assignment notification fails.

Checklist:

- [ ] Current assignee recorded
- [ ] Correct assignee confirmed
- [ ] Unauthorized assignee access removed
- [ ] Correct assignee access granted
- [ ] Notification resent or manual communication completed
- [ ] Audit entry created
- [ ] Evidence logged

## Document Recovery

Use when documents fail upload, download, authorization, or association to a shipment/load.

Checklist:

- [ ] Document record found
- [ ] Storage object exists
- [ ] Authorization checked
- [ ] Correct shipment/load association verified
- [ ] Re-upload or re-association path used if needed
- [ ] Unauthorized access ruled out
- [ ] Evidence logged

## Billing Recovery

Use when Stripe/app state differs, payment fails, refund occurs, or access is wrong.

Checklist:

- [ ] Stripe customer ID recorded
- [ ] Stripe payment/subscription/invoice ID recorded
- [ ] App billing record inspected
- [ ] Stripe state treated as money-movement source of truth
- [ ] App state corrected through audited path
- [ ] Access state corrected
- [ ] User notified if money/access/invoice changed
- [ ] Evidence logged

## Notification Recovery

Use when shipment, assignment, password reset, or billing notifications fail.

Checklist:

- [ ] Notification type identified
- [ ] Recipient confirmed
- [ ] Provider status checked
- [ ] App event/log checked
- [ ] Retry or resend path used if supported
- [ ] Manual communication completed if resend is unavailable
- [ ] Evidence logged

## Audit Verification

Every admin correction must create or reference an audit trail.

Checklist:

- [ ] Actor recorded
- [ ] Target record recorded
- [ ] Before value recorded where applicable
- [ ] After value recorded where applicable
- [ ] Reason recorded
- [ ] Timestamp recorded
- [ ] Support/blocker/incident ID recorded

## Escalation

Escalate immediately if:

- Admin cannot recover a critical production workflow
- Billing state is inconsistent across Stripe and app database
- Unauthorized access is suspected
- Data appears lost or corrupted
- Documents are exposed to unauthorized users
- Support cannot identify affected users

## Evidence

Record every recovery verification and incident recovery in `docs/LAUNCH_EVIDENCE_LOG.md`.
