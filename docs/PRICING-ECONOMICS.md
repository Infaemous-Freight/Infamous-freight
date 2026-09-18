# Infamous Freight — End-to-End Pricing & Revenue Model

## Purpose

Infamous Freight uses a hybrid revenue model. The customer-facing experience stays simple while the platform records the full economics of every freight transaction.

Core money loop:

shipper → quote → review → load → verified carrier → dispatch → tracking → delivery/POD → invoice → Stripe payment → revenue reconciliation → audit

## Freight transaction pricing

Default software configuration:

- Carrier cost: the verified carrier/linehaul cost.
- Accessorials: approved additional freight charges.
- Default operating margin: 12%.
- Minimum operating margin: $150.
- Customer price = carrier cost + accessorials + operating margin.

The 12% and $150 values are configuration defaults, not a legal determination of brokerage compensation. They must remain adjustable until Infamous Freight's final business/regulatory classification is confirmed.

Example:

- Carrier cost: $1,500
- Accessorials: $150
- Pricing base: $1,650
- 12% margin: $198
- Customer quote: $1,848

The actual contribution margin must also account for payment processing, claims, refunds, insurance, operations, taxes and other variable costs.

## Dispatch pricing

Two software-configured dispatch rates are supported:

- Standard dispatch: 5% of gross load revenue.
- Managed dispatch: 7% of gross load revenue.

Example on a $2,000 load:

- Standard: $100.
- Managed: $140.

Do not automatically stack a dispatch fee on top of a freight margin. The commercial agreement for the applicable business model determines which fee applies.

## Carrier pricing

Initial carrier access:

- Free verified onboarding.
- Eligible load access.
- Compliance/document reminders.

Optional carrier plans:

- Carrier Pro: $29/month.
- Carrier Pro+: $79/month.

Carrier subscriptions are secondary monetization and should not be required for a carrier to receive a properly eligible load.

## Platform pricing

- Starter: $99/month.
- Professional: $249/month.
- Enterprise: $499+/month.

Annual software pricing can be configured at a 10-month effective rate, subject to final Stripe Price configuration.

## Genesis AI

Genesis is included as the operating intelligence layer. Do not charge per conversation.

Genesis can assist with:

- quote intake;
- customer qualification;
- pricing preparation;
- carrier onboarding;
- document reminders;
- load matching;
- dispatch assistance;
- tracking updates;
- exception handling;
- POD collection;
- invoice preparation;
- payment-status communication.

Binding quotes, carrier approval, dispatch commitments, billing actions and money movement remain authorization-controlled.

## Stripe architecture

Stripe is the payment rail, not the source of freight truth.

Required flow:

1. Infamous Freight creates the commercial quote.
2. A human/authorized workflow accepts or binds the applicable transaction.
3. The load is dispatched and delivered.
4. POD is collected.
5. Invoice becomes payable.
6. Stripe Checkout or the configured payment flow collects funds.
7. Stripe webhook signature is verified.
8. Idempotent webhook processing updates billing state.
9. Infamous Freight records the payment and reconciles revenue.
10. Audit history links quote, load, invoice, payment and revenue records.

Stripe webhook events required by the current verification script include:

- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_succeeded
- invoice.payment_failed
- charge.refunded
- charge.dispute.created

Live Stripe Price IDs must be treated as authoritative for actual subscription amounts. Never infer live Stripe pricing from this document alone.

## Accounting metrics

For every transaction, track:

- quoted customer price;
- carrier cost;
- accessorials;
- gross margin dollars;
- gross margin percentage;
- dispatch/broker/platform fee where applicable;
- Stripe/payment fees;
- carrier payout;
- invoice status;
- amount collected;
- amount outstanding;
- days outstanding;
- refunds;
- disputes;
- net contribution;
- revenue recognition status;
- audit trail.

## Production safety

Before real-money launch:

- Confirm Infamous Freight's legal/business role.
- Confirm applicable authority, insurance, contracts and payment obligations.
- Verify live Stripe account and live Prices.
- Verify webhook endpoint and required events.
- Verify webhook signing secret.
- Verify production database migrations.
- Verify quote → load → carrier → dispatch → POD → invoice → payment.
- Verify payment reconciliation and audit records.
- Complete a controlled live-money test only after business approval.

## Implementation

The API pricing engine is implemented in `apps/api/src/pricing.ts`.

Endpoints:

- `GET /api/pricing/catalog`
- `POST /api/pricing/quote`
- `POST /api/pricing/dispatch-fee`

These endpoints are tenant-authenticated for calculations that could expose or create commercial pricing decisions. The public catalog is read-only.

The pricing engine intentionally separates pricing logic from Stripe Price IDs. This prevents commercial pricing rules from being silently changed by payment-provider configuration and makes regulatory/business-model changes easier to implement.

## Example economics

For a $2,000 customer transaction with a $1,700 carrier cost:

- Customer price: $2,000
- Carrier cost: $1,700
- Gross transaction margin: $300
- Payment/operating costs: deducted separately
- Net contribution: calculated after variable costs

At 20 transactions/day and $2,000 average customer price:

- Daily transaction volume: $40,000
- 30-day transaction volume: $1.2M
- At a 12% average gross margin: $144,000 gross transaction margin before variable and fixed expenses

These are scenario calculations, not revenue guarantees.
