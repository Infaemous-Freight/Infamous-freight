# Stripe Link Production Checklist

This checklist tracks Stripe Link production readiness for Infamous Freight.

## Screenshot Observations

Observed from Stripe Dashboard screenshot:

- Link enablement page is open.
- Multiple Link/payment method configurations show enabled.
- Payment optimization toggles appear enabled.
- Financial Connections appears enabled.
- Connect Onboarding appears enabled.
- Stripe still shows setup tasks for Link in Checkout and Elements.
- Domain registration is still shown as an action.

## Required Actions

- [ ] Confirm the active Stripe account is the correct Infamous Freight production account.
- [ ] Confirm all enabled payment method configurations are intentional.
- [ ] Confirm Link is enabled for the checkout flow used by the app.
- [ ] Register the production domain for Link where required.
- [ ] Confirm Checkout, Elements, Link Authentication Element, and Payment Request Button requirements.
- [ ] Confirm payment method settings are configured for production.
- [ ] Confirm Financial Connections is intentionally enabled.
- [ ] Confirm Connect Onboarding is intentionally enabled.
- [ ] Verify webhook endpoint is configured for production.
- [ ] Verify required Stripe environment variables are configured in deployment.
- [ ] Run a test checkout in test mode.
- [ ] Run a small production checkout only after compliance and business approval.
- [ ] Record test evidence in the production readiness evidence log.

## Environment Variables to Verify

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PUBLIC_KEY`
- Any deployment-specific Stripe variables used by the API or web app

## GitHub Evidence Location

Record verification results in:

`docs/production-operations/PRODUCTION_READINESS_EVIDENCE.md`

## Rule

Do not treat payments as production-ready until domain registration, webhook configuration, environment variables, test checkout, and access controls are verified.
