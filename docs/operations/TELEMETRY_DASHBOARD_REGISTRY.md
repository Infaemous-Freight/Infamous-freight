# Telemetry Dashboard Registry

Status: Provisioning-ready baseline (importable Grafana JSON + provider fallbacks)
Owner: Platform + Operations
Last updated: 2026-05-26

This runbook connects real runtime telemetry to KPI and weekly operations review workflows.

## Dashboard inventory

| Area | Dashboard definition | URL (set after import) | Owner | Fallback (until Grafana is complete) |
|---|---|---|---|---|
| API latency + deploy health | `docs/operations/grafana-dashboards/api-reliability-dashboard.json` | `TBD_GRAFANA_URL_API_RELIABILITY` | Platform on-call | Fly app health + GitHub Actions deploy/smoke artifacts |
| Dispatch + shipments | `docs/operations/grafana-dashboards/dispatch-shipments-dashboard.json` | `TBD_GRAFANA_URL_DISPATCH_SHIPMENTS` | Dispatch operations lead | Supabase SQL dashboard + weekly operations issue template |
| Billing + Stripe webhooks | `docs/operations/grafana-dashboards/billing-stripe-webhooks-dashboard.json` | `TBD_GRAFANA_URL_BILLING_WEBHOOKS` | Billing owner | Stripe Events dashboard + API webhook logs |
| AI usage | `docs/operations/grafana-dashboards/ai-usage-dashboard.json` | `TBD_GRAFANA_URL_AI_USAGE` | AI product owner | API `/api/ai-usage/summary` + Supabase query panels |
| Production exception alerting | Sentry alert rule (see below) | `TBD_SENTRY_ALERT_RULE_URL` | Platform on-call | Fly logs + GitHub Actions smoke failure notifications |

## Required metric coverage

- API latency
- 5xx rate
- dispatch latency
- shipment completion
- Stripe webhook failures
- Socket.io reconnect spikes
- AI usage volume

## KPI mappings

### 1) API latency and deploy health

- `p95_api_latency_ms` (target: `< 2000ms`)
- `api_5xx_rate` (target: `< 2%` over 5m)
- `deploy_success_rate` (target: `100%` on `main`)
- `live_health_check_pass_rate` for `/api/health/live` (target: `100%`)

### 2) Dispatch and shipment operations

- `dispatch_latency_minutes`
- `active_shipments_count`
- `shipment_completion_rate`
- `socket_reconnect_spike_ratio`

### 3) Billing and Stripe webhooks

- `stripe_webhook_failures`
- `stripe_webhook_success_rate`
- `checkout_success_count`
- `billing_sync_backlog`

### 4) AI usage

- `ai_usage_volume`
- `ai_usage_by_feature`
- `ai_request_latency_ms`
- `ai_override_rate`

## Sentry routing for repeated production exceptions

Create/verify a Sentry alert rule with:

- Environment: `production`
- Condition: same issue occurs `>= 5` times in `10` minutes
- Scope: API project
- Actions:
  - Notify Slack `#ops-alerts` (or configured ops channel)
  - Email platform on-call distribution
  - Create/attach incident issue when severity is error/fatal

## Operations review integration

Use this registry in the weekly operations review and launch gate checks:

- `docs/KPI-TRACKING.md`
- `.github/ISSUE_TEMPLATE/weekly_operations_review.md`
- `docs/OBSERVABILITY.md`
- `docs/RECOMMENDED_ACTIONS_RUNBOOK_2026-05-20.md`

During each review, record dashboard URL opened, reviewer, threshold breach, and follow-up owner.
