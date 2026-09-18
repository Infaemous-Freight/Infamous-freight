# Infamous Freight — Legal & Production Legitimacy Gate

Status: BLOCKED until the business model and regulated freight role are confirmed by counsel/qualified compliance professional.

## Operating-model decision
Infamous Freight must document which role it performs for each money flow: software/SaaS provider, dispatch service, freight broker, motor carrier, freight forwarder, or a combination.

Do not operate a regulated freight workflow as a broker/carrier until the required authority, contracts, insurance/financial responsibility, and operating controls are in place.

## If Infamous Freight operates as a property broker
Before arranging regulated interstate freight under its own brokerage authority, verify:
- FMCSA broker registration / operating authority
- MC authority status
- BOC-3 filing
- $75,000 broker financial responsibility through the applicable BMC-84 surety bond or BMC-85 trust
- required business/entity information
- applicable insurance and contractual requirements
- current FMCSA financial-responsibility rules effective January 16, 2026
- state-specific requirements where applicable

## Carrier verification gate
A carrier must not become dispatchable solely because signup was completed. Production state should capture legal identity, USDOT/MC information, authority status, insurance status, required documents, equipment, driver association where applicable, approval decision, expiration/reverification dates, and audit history.

Genesis must not bypass these controls.

## Payment and settlement gate
Stripe is a payment rail, not the freight system of record. Infamous Freight's ledger must reconcile customer charges, carrier payables, accessorials, platform/dispatch/broker fees, Stripe identifiers/fees, refunds, disputes, settlement state, and audit timestamps.

Do not enable carrier payouts until the legal merchant-of-record / broker / marketplace structure has been confirmed.

## Contract stack
Obtain counsel-reviewed versions of applicable shipper terms/transportation agreement, broker-carrier agreement, dispatch-service agreement, carrier onboarding terms, Terms of Service, Privacy Policy, payment/refund terms, cancellation/accessorial policy, claims procedure, electronic-consent language, AI/Genesis disclosure and authorization language, and applicable data-processing/security terms.

## Production release evidence
Require evidence for current code deployment, database migrations, authentication/session, tenant isolation, quote intake, load creation, carrier verification/assignment, dispatch, tracking, POD/delivery, invoicing, Stripe test checkout/webhooks, live Stripe configuration only after authorization, revenue reconciliation, security headers, secret exposure checks, rollback, and Genesis authorization boundaries.

## Important distinction
A green website deployment is not the same thing as a legally ready freight operation. The public marketing/lead-generation website can be launched before regulated freight operations are activated only if its copy accurately states what Infamous Freight currently does and does not represent itself as authorized to do.

Reviewed: 2026-09-17
