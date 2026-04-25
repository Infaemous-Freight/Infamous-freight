# Stripe Webhook Verification Matrix

Use this before paid beta and public launch. Stripe must be treated as the billing source of truth, while the application database must safely reflect Stripe state.

## Required Controls

- Webhook signature verification must be enabled.
- Webhook handlers must be idempotent.
- Duplicate events must not double-credit, double-charge, or duplicate invoices.
- Failed payments must not unlock paid access.
- Billing records must be auditable.
- Manual corrections must be logged.

## Configuration Checklist

- [ ] Stripe publishable key configured in frontend only
- [ ] Stripe secret key configured server-side only
- [ ] Stripe webhook signing secret configured server-side only
- [ ] Webhook endpoint URL configured in Stripe dashboard
- [ ] Webhook endpoint uses HTTPS
- [ ] Webhook endpoint logs event IDs without logging secrets
- [ ] Stripe mode confirmed: test or live
- [ ] Evidence logged in `docs/LAUNCH_EVIDENCE_LOG.md`

## Event Matrix

| Event | Expected Application Behavior | Status |
|---|---|---|
| `payment_intent.succeeded` | Payment marked successful once; access/order state updated once | UNKNOWN |
| `payment_intent.payment_failed` | Failure recorded; paid access not granted | UNKNOWN |
| `checkout.session.completed` | Customer/session linked; fulfillment starts only once | UNKNOWN |
| `invoice.paid` | Subscription/invoice marked paid once | UNKNOWN |
| `invoice.payment_failed` | Account billing state marked past due or failed | UNKNOWN |
| `customer.subscription.updated` | Subscription status, plan, and renewal data updated | UNKNOWN |
| `customer.subscription.deleted` | Subscription cancellation reflected; access adjusted according to policy | UNKNOWN |
| `charge.refunded` | Refund recorded; user/account state adjusted if required | UNKNOWN |

## Idempotency Tests

### Duplicate Event

Purpose: Confirm event replay does not duplicate side effects.

Steps:

1. Trigger or replay a successful payment-related event.
2. Confirm app state updates correctly.
3. Replay the same event ID.
4. Confirm no duplicate invoice, duplicate access grant, duplicate notification, or duplicate accounting event is created.

Checklist:

- [ ] First event processed successfully
- [ ] Duplicate event recognized
- [ ] Duplicate event does not create duplicate side effects
- [ ] Event ID stored or otherwise handled idempotently
- [ ] Evidence logged

Status: PASS / FAIL

### Delayed Event

Purpose: Confirm delayed webhooks do not corrupt newer state.

Steps:

1. Create a billing state transition.
2. Simulate or replay an older event after a newer event.
3. Confirm older event does not overwrite newer valid state incorrectly.

Checklist:

- [ ] Delayed event received
- [ ] State transition rules protect newer state
- [ ] Audit trail records handling
- [ ] Evidence logged

Status: PASS / FAIL

### Invalid Signature

Purpose: Confirm endpoint rejects forged webhook requests.

Checklist:

- [ ] Request with invalid signature rejected
- [ ] Request without signature rejected
- [ ] Rejection logged without secret exposure
- [ ] Evidence logged

Status: PASS / FAIL

## Controlled Live Payment Test

Run only when ready for paid beta or public launch.

Checklist:

- [ ] Internal test customer approved
- [ ] Low-dollar amount approved
- [ ] Live payment completes in Stripe
- [ ] App database reflects payment success
- [ ] Receipt/invoice created if applicable
- [ ] Webhook event ID recorded
- [ ] Refund/void action completed if required
- [ ] Evidence logged

## Failed Payment Test

Checklist:

- [ ] Failed payment created or simulated
- [ ] Failure visible in Stripe
- [ ] Failure visible in app/admin
- [ ] Paid access not granted
- [ ] User-facing error state is clear
- [ ] Support/admin can inspect failure
- [ ] Evidence logged

## Refund/Cancellation Test

Checklist:

- [ ] Refund or cancellation created in Stripe
- [ ] App receives corresponding event
- [ ] App updates billing state correctly
- [ ] User access behavior follows policy
- [ ] Admin can see history
- [ ] Evidence logged

## Admin Reconciliation

If Stripe and app state disagree:

1. Treat Stripe as source of truth for money movement.
2. Identify affected user/customer/payment IDs.
3. Correct app state through admin tooling or controlled script.
4. Log the correction.
5. Notify user if money, access, or invoices were affected.
6. Create a root-cause issue.

## Launch Gate

Paid beta and public launch are blocked unless:

- [ ] Signature verification passes
- [ ] Success event passes
- [ ] Failure event passes
- [ ] Duplicate webhook event is idempotent
- [ ] Delayed event does not corrupt state
- [ ] Admin can inspect billing failures
- [ ] Evidence is recorded
