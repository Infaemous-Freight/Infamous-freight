<p align="center">
  <a href="https://infamousfreight.com" target="_blank" rel="noopener noreferrer">
    <img src="/docs/screenshots/infamousfreight-header.svg" alt="Infamous Freight" width="100%">
  </a>
</p>

# Infamous Freight — API Reference

_Last updated: June 2026_

This document lists the implemented API endpoints in the active Express 5 backend (`apps/api/src/app.ts`).

> For the canonical architecture overview, see [`docs/ARCHITECTURE.md`](ARCHITECTURE.md). For live/demo/not-ready product status, see [`docs/current-status.md`](current-status.md).

---

## Base URL

| Environment | Base URL | Notes |
|---|---|---|
| Local API development | `http://localhost:3000` | Direct Express API when running the API process locally. |
| Docker Compose web entrypoint | `http://localhost:3000` | Browser entrypoint through the nginx `web` container; `/api/*` proxies to the API container on internal port `3000`. |
| Docker Compose direct API diagnostics | `http://localhost:4000` | Host-mapped API port from `docker-compose.yml` (`4000:3000`). |
| Production browser path | `https://www.infamousfreight.com/api` | Same-origin browser API path proxied to Fly.io. |
| Production direct API diagnostics | `https://api.infamousfreight.com` | Direct API hostname for operator diagnostics and smoke checks. |

---

## Authentication and tenant context

Production protected routes use trusted authenticated context by default.

### Production / trusted auth mode

In production, the API should run in trusted JWT mode unless explicitly configured otherwise. Tenant, user, role, and billing context are derived from verified authentication and database-backed records. Clients should authenticate normally through the application auth flow rather than manually supplying tenant or role headers.

JWT verification requires either `SUPABASE_JWT_SECRET` or `JWT_SECRET`. Tokens are verified before their claims are trusted.

### Local / test header auth mode

Header-based tenant context is only for local development, tests, or explicitly configured transitional environments where header auth is allowed.

| Header | Local/test purpose |
|---|---|
| `x-tenant-id` | Carrier / tenant identifier for protected route testing. Request body and query-string tenant values are not accepted for protected routes. |
| `x-user-role` | Role used for authorization checks. Supported operational roles include `owner`, `admin`, and `dispatcher`; billing actions require `owner` or `admin`. |

Do not enable unsafe header auth in production unless there is a documented, time-limited incident or migration reason.

---

## Response headers

All API responses include an `x-request-id` response header. Clients may provide `x-request-id`; otherwise the API generates one.

---

## Health Checks

Health endpoints do not require authentication.

### `GET /health`

Returns liveness-style API status plus database status for operator convenience. This endpoint keeps HTTP `200` even if the database is degraded so uptime probes can remain lightweight.

```json
{
  "status": "ok",
  "timestamp": "2026-04-27T08:00:00.000Z",
  "services": { "api": "running", "database": "connected" }
}
```

### `GET /health/live`

Returns API liveness only.

### `GET /health/ready`

Returns database readiness. HTTP status is `200` when ready and `503` when the database is disconnected.

### `GET /api/health`

Returns readiness status at the `/api` prefix for Netlify and same-origin proxy checks. HTTP status is `200` when ready and `503` when the database is disconnected.

### `GET /api/health/live`

Returns API liveness at the `/api` prefix.

### `GET /api/health/ready`

Returns database readiness at the `/api` prefix.

---

## Loads

### `GET /api/loads`

List all loads for the authenticated tenant.

**Auth:** protected tenant route.

```json
{ "data": [ /* load objects */ ], "count": 12 }
```

### `POST /api/loads`

Create a new load for the authenticated tenant.

**Auth:** protected tenant route.

**Body:** Load creation fields, aligned with the Prisma data model.

```json
{ "data": { /* created load */ } }
```

---

## Drivers

### `GET /api/drivers`

List all drivers for the authenticated tenant.

**Auth:** protected tenant route.

```json
{ "data": [ /* driver objects */ ], "count": 5 }
```

### `POST /api/drivers`

Create a new driver for the authenticated tenant.

**Auth:** protected tenant route.

**Body:** Driver creation fields.

```json
{ "data": { /* created driver */ } }
```

---

## Shipments

### `GET /api/shipments`

List all shipments for the authenticated tenant.

**Auth:** protected tenant route.

```json
{ "data": [ /* shipment objects */ ], "count": 8 }
```

### `POST /api/shipments`

Create a new shipment for the authenticated tenant.

**Auth:** protected tenant route.

**Body:** Shipment creation fields.

```json
{ "data": { /* created shipment */ } }
```

---

## Freight Operations

These endpoints provide CRUD access to freight operation resources.

**Supported `:resource` values:**

| Resource | Description |
|---|---|
| `quoteRequests` | Shipper quote requests |
| `loadAssignments` | Driver load assignment records |
| `loadDispatches` | Dispatch records |
| `shipmentTracking` | Location and status tracking entries |
| `deliveryConfirmations` | Proof-of-delivery confirmations |
| `carrierPayments` | Carrier payment records |
| `rateAgreements` | Rate agreements between parties |
| `operationalMetrics` | Aggregated operational KPIs |
| `loadBoardPosts` | Public load board postings |

### `GET /api/freight-operations/:resource`

List all records for the given resource for the authenticated tenant.

**Auth:** protected tenant route.

```json
{ "data": [ /* records */ ], "count": 3 }
```

### `POST /api/freight-operations/:resource`

Create a new record for the given resource.

**Auth:** protected tenant route.

**Body:** Resource-specific creation fields.

```json
{ "data": { /* created record */ } }
```

### `PATCH /api/freight-operations/:resource/:id`

Update an existing record for the given resource.

**Auth:** protected tenant route.

**Body:** Partial update fields.

```json
{ "data": { /* updated record */ } }
```

**Error:** `404 freight_operation_not_found` when the record does not exist for this tenant.

---

## Workflows

These endpoints drive state transitions in multi-step freight workflows.

### `POST /api/workflows/quotes/:id/convert-to-load`

Convert an approved quote request into a load record.

**Auth:** protected tenant route.

**Body:** Optional conversion fields.

```json
{ "data": { /* created load */ } }
```

**Error:** `404 quote_request_not_found`.

### `POST /api/workflows/load-assignments/:id/:decision`

Accept or reject a load assignment. `:decision` must be `accepted` or `rejected`.

**Auth:** protected tenant route.

**Body:** Optional decision metadata.

```json
{ "data": { /* updated assignment */ } }
```

### `POST /api/workflows/dispatches/:id/confirm`

Confirm a pending dispatch.

**Auth:** protected tenant route.

**Body:** Optional confirmation fields.

```json
{ "data": { /* updated dispatch */ } }
```

### `POST /api/workflows/loads/:loadId/tracking-updates`

Record a new tracking update for a load.

**Auth:** protected tenant route.

**Body:** Tracking update fields such as location, status, and timestamp.

```json
{ "data": { /* created tracking update */ } }
```

**Error:** `404 load_not_found_for_tenant`.

### `POST /api/workflows/loads/:loadId/verify-delivery`

Record a delivery confirmation / proof of delivery for a load.

**Auth:** protected tenant route.

**Body:** Delivery verification fields.

```json
{ "data": { /* created delivery verification */ } }
```

### `POST /api/workflows/carrier-payments/:id/status`

Update the status of a carrier payment record.

**Auth:** protected tenant route.

**Body:**

```json
{ "status": "..." }
```

```json
{ "data": { /* updated payment */ } }
```

### `POST /api/workflows/operational-metrics/rollup`

Create a rolled-up operational metrics snapshot for the tenant.

**Auth:** protected tenant route.

**Body:** Metrics rollup fields.

```json
{ "data": { /* created metrics record */ } }
```

### `POST /api/workflows/load-board-posts/:id/status`

Update the status of a load board post, such as active, filled, or expired.

**Auth:** protected tenant route.

**Body:**

```json
{ "status": "..." }
```

```json
{ "data": { /* updated post */ } }
```

---

## Billing

Billing actions require an authenticated role of `owner` or `admin`. In trusted production mode, this role must come from verified auth context and backend records. In local/test header mode, the role may be supplied through `x-user-role` only when unsafe header auth is explicitly enabled.

### `GET /api/billing/status`

Return Stripe customer status for the authenticated tenant.

**Auth:** protected billing route; owner/admin required.

```json
{
  "data": {
    "stripeCustomerId": "cus_...",
    "hasStripeCustomer": true
  }
}
```

### `POST /api/billing/checkout-session`

Create a Stripe Checkout Session to set up a new subscription.

**Auth:** protected billing route; owner/admin required.

**Body:**

```json
{
  "plan": "starter | professional | enterprise",
  "billingInterval": "month | year"
}
```

```json
{ "data": { "url": "https://checkout.stripe.com/..." } }
```

**Error:** `409 stripe_customer_already_linked` when the tenant already has a Stripe customer. Use Customer Portal instead.

### `POST /api/billing/customer-portal`

Create a Stripe Customer Portal session to manage an existing subscription.

**Auth:** protected billing route; owner/admin required.

```json
{ "data": { "url": "https://billing.stripe.com/..." } }
```

**Error:** `404 stripe_customer_not_found`.

### `POST /api/billing/webhook`

Stripe webhook receiver. **Do not call this manually.**

- Requires a valid `stripe-signature` header matching `STRIPE_WEBHOOK_SECRET`.
- Raw body is required, not JSON-parsed body.
- Records and processes `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, and related events.
- Uses webhook-event idempotency to prevent duplicate processing.

```json
{ "received": true }
```

---

## AI Usage

### `POST /api/ai-usage/events`

Record an AI feature usage event for the authenticated tenant.

**Auth:** protected tenant route.

**Body:**

```json
{
  "feature": "auto-dispatch",
  "model": "gpt-4o",
  "promptTokens": 512,
  "completionTokens": 128
}
```

`feature` is required. Other fields are optional metadata.

```json
{ "data": { /* recorded event */ } }
```

### `GET /api/ai-usage/summary`

Return an AI usage summary for the authenticated tenant.

**Auth:** protected tenant route.

```json
{ "data": { /* usage summary */ } }
```

---

## AI Site Assistant

### `POST /api/chat`

Streams a logistics-focused assistant response for the public site chat widget.

The endpoint accepts recent chat messages, keeps only supported `user` and `assistant` roles, caps retained history and message length, prepends the Infamous Freight assistant instructions, and returns server-sent events.

**Body:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Can you help quote a dry van lane?"
    }
  ]
}
```

Successful responses use `text/event-stream` and emit JSON `data:` events with streamed `content` chunks, followed by `data: [DONE]`.

Runtime configuration:

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | Server-side OpenAI-compatible provider settings. Netlify AI Gateway can inject these automatically for deployed server-side code. |
| `AI_CHAT_MODEL` | Optional model override. Defaults to `gpt-5.2`. |
| `AI_CHAT_TIMEOUT_MS` | Optional positive integer timeout in milliseconds. Defaults to `25000`. |

Do not expose provider keys through browser `VITE_*` variables.

---

## Error Responses

All error responses follow this shape:

```json
{
  "error": "error_code",
  "message": "Human-readable description."
}
```

Common error codes:

| Code | HTTP Status | Description |
|---|---|---|
| `unauthorized` | `401` | Protected route was called without valid authentication in trusted auth mode. |
| `tenant_id_required` | `400` | Tenant context is missing. In production, this usually means trusted auth context did not resolve a tenant. In local/test header mode, this usually means `x-tenant-id` is missing. |
| `forbidden` | `403` | The authenticated role is missing or not allowed for the route. |
| `billing_forbidden` | `403` | Billing action attempted by a non-owner/admin role. |
| `invalid_billing_plan` | `400` | `plan` must be `starter`, `professional`, or `enterprise`. |
| `invalid_billing_interval` | `400` | `billingInterval` must be `month` or `year`. |
| `stripe_customer_already_linked` | `409` | Tenant already has a Stripe customer. |
| `stripe_customer_not_found` | `404` | No Stripe customer linked to this tenant. |
| `freight_operation_resource_not_found` | `404` | Unsupported `:resource` value. |
| `freight_operation_not_found` | `404` | Record not found for this tenant. |
| `load_not_found_for_tenant` | `404` | Referenced load not found for this tenant. |
| `quote_request_not_found` | `404` | Quote request not found for this tenant. |
| `invalid_load_assignment_decision` | `400` | `:decision` must be `accepted` or `rejected`. |
| `ai_usage_feature_required` | `400` | `feature` field missing from AI usage event body. |
| `invalid_stripe_signature` | `400` | Stripe webhook signature verification failed. |
| `stripe_secret_key_required` | `500` | `STRIPE_SECRET_KEY` environment variable not set. |
| `missing_messages` | `400` | `/api/chat` request did not include at least one user message. |
| `chat_timeout` | `504` | AI assistant response exceeded the configured timeout. |
| `chat_not_configured` | `503` | AI assistant provider environment is not configured. |
| `internal_server_error` | `500` | Unexpected server error. |

---

## Planned / Not-Yet-Implemented Routes

The following route patterns are described in planning documents but are **not currently implemented** in the Express API. They should be added as Express route handlers or route modules when the features are built.

| Route pattern | Planned feature |
|---|---|
| `GET /api/dispatch/auto` | Auto-dispatch AI |
| `GET /api/dispatch/backhauls/:driverId` | Backhaul finder |
| `GET /api/invoices` | Invoice list |
| `POST /api/invoices` | Create invoice |
| `GET /api/rate-analytics/trend` | Market rate trends |
| `GET /api/factoring/*` | Factoring integrations |
| `GET /api/broker-credit/*` | Broker credit scoring |
| `GET /api/eld/*` | ELD provider sync |
| `GET /api/payroll/*` | Driver payroll |
| `GET /api/compliance-csa/*` | CSA monitoring |
| `GET /api/compliance-expiry/*` | Document expiry tracking |
| `GET /api/accounting/*` | QuickBooks / Xero sync |
| `GET /api/geofencing/*` | Geofence alerts and ETA |
| `GET /api/ifta/*` | IFTA fuel tax reporting |
| `GET /api/rbac/*` | Role and permission management |
| `GET /api/ratecon/*` | Rate confirmation generation |

See [`docs/ARCHITECTURE.md`](ARCHITECTURE.md#planned--in-development-features) for migration status.
