# Infamous Freight Production Monitoring

This runbook defines the production monitoring model for Infamous Freight.

## Architecture

The production monitor is a deterministic polling worker. It runs outside the application stack on a persistent Linux host and checks public web, API, Fly.io, readiness, and diagnostic endpoints on a fixed interval.

The monitor is implemented in `scripts/production-monitor.mjs` and is designed to run under `systemd` with `deploy/production-monitor.service`.

## Execution model

- Host: persistent Linux VM or equivalent always-on host
- Runtime: Node.js 22
- Process manager: systemd
- Interval: 5 minutes by default
- Logs: JSON lines
- Alerting: PagerDuty for P1/P2, Slack for P1/P2, Sentry-compatible event trail, optional AI incident webhook

## Default monitored endpoints

| Endpoint | Purpose | Expected result | Severity |
| --- | --- | --- | --- |
| `https://www.infamousfreight.com/health` | Web layer uptime | 200 | P2 |
| `https://www.infamousfreight.com/api/health` | Public API proxy readiness | 200 or 503 | P1 |
| `https://www.infamousfreight.com/api/health/ready` | Readiness through web domain | 200 or 503 | P1 |
| `https://infamous-freight-api.fly.dev/api/health/live` | Direct Fly liveness | 200 | P1 |
| `https://infamous-freight-api.fly.dev/api/health` | Direct Fly health | 200 or 503 | P1 |
| `https://infamous-freight-api.fly.dev/api/metrics` | Diagnostics availability | 200, 204, 401, 403, or 404 | P3 |
| `https://infamous-freight-api.fly.dev/api/health/database` | Database health diagnostic | 200, 204, 401, 403, 404, or 503 | P1 |
| `https://infamous-freight-api.fly.dev/api/health/performance` | Performance diagnostic | 200, 204, 401, 403, or 404 | P3 |

Readiness can return 503 during controlled deployment or dependency degradation. The monitor records that state and escalates only after the configured consecutive-failure threshold.

## Severity policy

| Severity | Meaning | Delivery |
| --- | --- | --- |
| P1 | Production outage or core API risk | PagerDuty and Slack immediately after failure threshold |
| P2 | Web/customer-facing degradation | PagerDuty and Slack after failure threshold |
| P3 | Diagnostic or medium-risk signal | Structured logs and Sentry/event trail |

## Thresholds

| Setting | Default | Purpose |
| --- | ---: | --- |
| Poll interval | 300000 ms | Run every 5 minutes |
| Consecutive failures | 2 | Avoid paging on one transient failure |
| p95 latency target | 1000 ms | Flag latency regressions for production API paths |

## Deployment checklist

1. Provision a persistent Linux host.
2. Install Node.js 22.
3. Clone the repository to `/opt/infamous-freight`.
4. Configure a private monitor environment file on the host.
5. Install `deploy/production-monitor.service` into systemd.
6. Start and enable the service.
7. Confirm logs are flowing.
8. Confirm dry-run mode can be disabled only after alert destinations are verified.

## Validation commands

```bash
node scripts/production-monitor.mjs --once --dry-run
systemctl status production-monitor
journalctl -u production-monitor -n 100 --no-pager
tail -n 100 /var/log/infamous-freight/production-monitor.log
```

## Rollback

```bash
systemctl stop production-monitor
systemctl disable production-monitor
```

Application traffic is not affected by disabling the monitor. Disabling the monitor only stops external polling and alert delivery.

## Freight-specific follow-up monitors

Infrastructure checks are necessary but not sufficient for freight operations. The next production monitors should cover:

- Active dispatch without recent GPS heartbeat
- POD missing after delivery window
- HOS risk over configured threshold
- Carrier compliance expiration
- Billing or invoice generation failure
- Stripe webhook delivery failure
- Shipment delay risk over configured threshold

These should use authenticated internal API endpoints and tenant-aware service credentials. Do not expose operational freight data through public unauthenticated monitoring routes.
