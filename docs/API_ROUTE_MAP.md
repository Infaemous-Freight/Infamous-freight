# API Route Map

Status: Current implemented API surface for the Express API.

This document lists the routes implemented in `apps/api/src/app.ts`. Do not use older PDF-generated route maps as production truth unless the corresponding routes exist in code.

## Auth legend

Production protected routes use trusted authenticated context by default. The API verifies a bearer JWT with `SUPABASE_JWT_SECRET` or `JWT_SECRET`, derives tenant context from trusted claims, and confirms role through database-backed carrier membership before authorizing tenant-scoped work.

Header auth (`x-tenant-id` and `x-user-role`) is local/test/transitional only and must not be treated as final production authority. Subscription-gated routes prefer stored Stripe-synced carrier billing status; client billing-status headers are only accepted in tests or when explicitly enabled for a transitional environment.

| Auth label | Meaning |
|---|---|
| No | Public health or diagnostic route; no tenant auth required. |
| Trusted tenant + role | Production JWT-backed tenant context and database-backed role membership. Local/test header auth can exercise the same route only when header auth mode is enabled. |
| Trusted tenant + owner/admin | Production JWT-backed tenant context with database-backed `owner` or `admin` membership. |
| Stripe signature | Raw Stripe webhook body verified with `stripe-signature` and `STRIPE_WEBHOOK_SECRET`. |

## Health

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | No | Runtime health check |
| GET | `/api/health` | No | API-prefixed runtime health check |

## Billing

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/billing/status` | Trusted tenant + role | Carrier Stripe link status |
| POST | `/api/billing/checkout-session` | Trusted tenant + owner/admin | Create checkout session |
| POST | `/api/billing/customer-portal` | Trusted tenant + owner/admin | Create customer portal session |
| POST | `/api/billing/webhook` | Stripe signature | Stripe webhook receiver |

## AI Usage

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/ai-usage/events` | Trusted tenant + role + stored active/trial billing status | Record AI usage event |
| GET | `/api/ai-usage/summary` | Trusted tenant + role + stored active/trial billing status | Summarize AI usage |

## Core Operations

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/loads` | Trusted tenant + role + stored active/trial billing status | List tenant loads |
| POST | `/api/loads` | Trusted tenant + role + stored active/trial billing status | Create tenant load |
| GET | `/api/drivers` | Trusted tenant + role + stored active/trial billing status | List tenant drivers |
| POST | `/api/drivers` | Trusted tenant + role + stored active/trial billing status | Create tenant driver |
| GET | `/api/shipments` | Trusted tenant + role + stored active/trial billing status | List tenant shipments |
| POST | `/api/shipments` | Trusted tenant + role + stored active/trial billing status | Create tenant shipment |

## Freight Operation Resources

Supported resources:

- `quoteRequests`
- `loadAssignments`
- `loadDispatches`
- `shipmentTracking`
- `deliveryConfirmations`
- `carrierPayments`
- `rateAgreements`
- `operationalMetrics`
- `loadBoardPosts`

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/freight-operations/:resource` | Trusted tenant + role + stored active/trial billing status | List records for a supported resource |
| POST | `/api/freight-operations/:resource` | Trusted tenant + role + stored active/trial billing status | Create record for a supported resource |
| PATCH | `/api/freight-operations/:resource/:id` | Trusted tenant + role + stored active/trial billing status | Update record for a supported resource |

## Workflow Routes

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/workflows/quotes/:id/convert-to-load` | Trusted tenant + role + stored active/trial billing status | Convert quote request to load |
| POST | `/api/workflows/load-assignments/:id/:decision` | Trusted tenant + role + stored active/trial billing status | Accept or reject load assignment |
| POST | `/api/workflows/dispatches/:id/confirm` | Trusted tenant + role + stored active/trial billing status | Confirm dispatch |
| POST | `/api/workflows/loads/:loadId/tracking-updates` | Trusted tenant + role + stored active/trial billing status | Record tracking update |
| POST | `/api/workflows/loads/:loadId/verify-delivery` | Trusted tenant + role + stored active/trial billing status | Verify delivery |
| POST | `/api/workflows/carrier-payments/:id/status` | Trusted tenant + role + stored active/trial billing status | Update carrier payment status |
| POST | `/api/workflows/operational-metrics/rollup` | Trusted tenant + role + stored active/trial billing status | Roll up operational metrics |
| POST | `/api/workflows/load-board-posts/:id/status` | Trusted tenant + role + stored active/trial billing status | Update load-board post status |

## Rate Limiting

All `/api/*` routes are protected by the API rate limiter unless disabled with `RATE_LIMIT_ENABLED=false`.

Environment variables:

| Variable | Default | Purpose |
|---|---:|---|
| `RATE_LIMIT_ENABLED` | enabled unless set to `false` | Enables/disables rate limiting |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window size in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | `120` | Max requests per key/window |

Exceeded requests return:

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Try again after the retry window."
}
```

The response also includes a `Retry-After` header.

## Production auth warning

Do not rely on client-supplied `x-tenant-id`, `x-user-role`, or billing-status headers as production authority. In production, keep `AUTH_MODE=trusted` and configure `SUPABASE_JWT_SECRET` or `JWT_SECRET` so protected routes require a verified bearer token plus database-backed carrier membership. Header auth is intended only for local tests or explicitly approved transitional environments.
