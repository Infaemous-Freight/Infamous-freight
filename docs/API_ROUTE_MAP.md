# API Route Map

Status: Current implemented API surface for the Express API.

This document lists the routes implemented in `apps/api/src/app.ts`. Do not use older PDF-generated route maps as production truth unless the corresponding routes exist in code.

## Health

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | No | Runtime health check |
| GET | `/api/health` | No | API-prefixed runtime health check |

## Billing

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/billing/status` | Tenant + role headers currently | Carrier Stripe link status |
| POST | `/api/billing/checkout-session` | Tenant + owner/admin role currently | Create checkout session |
| POST | `/api/billing/customer-portal` | Tenant + owner/admin role currently | Create customer portal session |
| POST | `/api/billing/webhook` | Stripe signature | Stripe webhook receiver |

## AI Usage

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/ai-usage/events` | Tenant + role headers currently | Record AI usage event |
| GET | `/api/ai-usage/summary` | Tenant + role headers currently | Summarize AI usage |

## Core Operations

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/loads` | Tenant + role headers currently | List tenant loads |
| POST | `/api/loads` | Tenant + role headers currently | Create tenant load |
| GET | `/api/drivers` | Tenant + role headers currently | List tenant drivers |
| POST | `/api/drivers` | Tenant + role headers currently | Create tenant driver |
| GET | `/api/shipments` | Tenant + role headers currently | List tenant shipments |
| POST | `/api/shipments` | Tenant + role headers currently | Create tenant shipment |

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
| GET | `/api/freight-operations/:resource` | Tenant + role headers currently | List records for a supported resource |
| POST | `/api/freight-operations/:resource` | Tenant + role headers currently | Create record for a supported resource |
| PATCH | `/api/freight-operations/:resource/:id` | Tenant + role headers currently | Update record for a supported resource |

## Workflow Routes

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/workflows/quotes/:id/convert-to-load` | Tenant + role headers currently | Convert quote request to load |
| POST | `/api/workflows/load-assignments/:id/:decision` | Tenant + role headers currently | Accept or reject load assignment |
| POST | `/api/workflows/dispatches/:id/confirm` | Tenant + role headers currently | Confirm dispatch |
| POST | `/api/workflows/loads/:loadId/tracking-updates` | Tenant + role headers currently | Record tracking update |
| POST | `/api/workflows/loads/:loadId/verify-delivery` | Tenant + role headers currently | Verify delivery |
| POST | `/api/workflows/carrier-payments/:id/status` | Tenant + role headers currently | Update carrier payment status |
| POST | `/api/workflows/operational-metrics/rollup` | Tenant + role headers currently | Roll up operational metrics |
| POST | `/api/workflows/load-board-posts/:id/status` | Tenant + role headers currently | Update load-board post status |

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

## Production Auth Warning

The current route protection still depends on tenant/role request headers in several places. That is not sufficient for production authorization. Complete the server-side auth migration before paid beta or public launch.
