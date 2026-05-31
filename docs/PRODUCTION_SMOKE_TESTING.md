# Production Smoke Testing

This checklist verifies that INFÆMOUS FREIGHT is safe to review after a production deploy. It does not replace full launch approval, security review, billing verification, or database migration review.

## When to run

Run this checklist after:

- Netlify web deploys
- Fly.io API deploys
- Stripe billing changes
- public route changes
- authentication or route-gating changes
- tracking, quote, or customer-intake changes

## Automated public smoke check

```bash
pnpm run production:smoke-test
```

The automated script should verify the public production path where possible, including canonical frontend loading, redirect behavior, API health, and safe public endpoint behavior.

## Required public checks

| Check | Expected result |
| --- | --- |
| `https://www.infamousfreight.com` | Loads the production web app. |
| `https://infamousfreight.com` | Redirects to the canonical `www` host. |
| `https://www.infamousfreight.com/api/health` | Returns a healthy API response through the Netlify-to-Fly proxy. |
| `https://www.infamousfreight.com/api/health/live` | Returns liveness status. |
| `https://www.infamousfreight.com/api/health/ready` | Returns readiness status. |
| `/request-quote` | Public quote form loads and submits through the expected path. |
| `/track-shipment` | Tracking UI loads and handles malformed, unknown, and known-safe tracking cases. |
| `/pricing` | Pricing and billing call-to-action paths render correctly. |
| `/contact` | Contact path loads and captures expected intake behavior. |

## Public tracking cases

Track all three cases before launch approval:

1. **Malformed tracking number** should return a validation error.
2. **Well-formed but unknown tracking number** should return a safe not-found response.
3. **Known-safe production tracking number** should return a sanitized public shipment payload.

Do not use customer-sensitive or private shipment data for public positive tracking tests.

## Billing checks

Run billing checks when billing code, Stripe configuration, pricing, checkout, webhooks, or Customer Portal behavior changes.

```bash
pnpm run billing:verify-live
```

Manual billing validation should include:

- Stripe Checkout opens from production.
- Customer Portal opens for controlled test customers.
- Webhook endpoint receives and processes controlled test events.
- Paid-access gating behaves as expected after checkout.
- Failed or cancelled checkout does not incorrectly unlock paid access.

## Authenticated route checks

Verify each authenticated route against `docs/current-status.md` and `apps/web/src/lib/routeReadiness.ts`.

| Route | Required behavior |
| --- | --- |
| `/ops` | Shows readiness/demo-backed state if not fully live. |
| `/loads` | Does not imply demo data is production data. |
| `/dispatch` | Does not allow production dispatch execution unless live wiring is complete. |
| `/ops/drivers` | Shows correct driver-readiness state. |
| `/settings/billing` | Billing access is live and gated correctly. |
| `/messages` | Remains gated until production-ready. |
| `/driver-app` | Remains gated until production-ready. |

## Evidence capture

After production checks, capture evidence:

```bash
pnpm run production:capture-netlify-evidence
```

Record:

- deployment timestamp
- deployed commit SHA
- Netlify deploy URL
- Fly.io app/version details
- health check output
- route smoke result
- billing verification notes when applicable
- known blockers or follow-up tasks

## Launch approval rule

Do not approve public launch from this checklist alone. Launch approval requires credential-backed production checks, migration review/application where applicable, billing evidence when billing is touched, and recorded evidence in the launch readiness documents.
