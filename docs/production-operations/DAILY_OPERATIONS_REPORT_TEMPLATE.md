# Daily Operations Report Template

Use this report every production day while Infamous Freight is operating with real users. Keep entries factual, timestamped, and safe to share internally. Do not include secrets, session cookies, full payment details, or unnecessary customer PII.

## Report Header

| Field | Value |
|---|---|
| Date |  |
| Prepared by |  |
| Coverage window |  |
| Production web URL | `https://www.infamousfreight.com` |
| Production API | `infamous-freight-api` |
| Fly health path | `https://infamous-freight-api.fly.dev/api/health/live` |
| Overall status | Green / Yellow / Red |

## Production Health

| Metric | Target | Actual | Status | Source / link |
|---|---:|---:|---|---|
| API uptime | 99.9% daily target |  |  |  |
| API error rate | No unexplained spike |  |  |  |
| API p95 latency | Record baseline, investigate regression |  |  |  |
| Fly machine health | All expected checks healthy |  |  |  |
| Web deploy health | Latest production deploy stable |  |  |  |
| Sentry/open error count | No critical untriaged errors |  |  |  |

## Security and Access Signals

| Metric | Actual | Investigation notes | Owner |
|---|---:|---|---|
| Failed logins |  |  |  |
| Password reset failures |  |  |  |
| Unauthorized/forbidden API responses spike |  |  |  |
| Suspicious tenant-access attempts |  |  |  |
| Secrets or sensitive-data exposure reports |  |  |  |

## Billing Signals

| Metric | Actual | Investigation notes | Owner |
|---|---:|---|---|
| Checkout sessions started |  |  |  |
| Successful subscriptions |  |  |  |
| Upgrades |  |  |  |
| Downgrades |  |  |  |
| Cancellations |  |  |  |
| Failed Stripe webhooks |  |  |  |
| Payment failures |  |  |  |

## Freight Operations Signals

| Metric | Actual | Notes |
|---|---:|---|
| Quote submissions |  |  |
| Quote follow-ups completed same day |  |  |
| Tracking lookups |  |  |
| Loads created |  |  |
| Loads assigned |  |  |
| Shipment status updates |  |  |
| POD uploads |  |  |
| Invoices generated |  |  |

## Usage Signals

| Signal | Finding | Action |
|---|---|---|
| Most visited pages |  |  |
| Abandoned signup flows |  |  |
| Failed quote submissions |  |  |
| Highest-used features |  |  |
| Lowest-used critical features |  |  |
| Support/contact themes |  |  |

## Customer Acquisition Progress

Target: **10 paying customers before major new features.**

| Segment | New leads | Demos booked | Trials started | Paying customers | Notes |
|---|---:|---:|---:|---:|---|
| Independent owner-operators |  |  |  |  |  |
| Small carriers (1–20 trucks) |  |  |  |  |  |
| Freight brokers |  |  |  |  |  |
| Local shippers |  |  |  |  |  |

## Incidents, Blockers, and Follow-Ups

| Severity | Issue | Customer impact | Owner | Next action | Due date | Status |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

## Daily Decision

| Question | Decision |
|---|---|
| Is production stable enough to continue sales outreach tomorrow? | YES / NO |
| Is any customer-impacting fix required before outreach? | YES / NO |
| Is any Phase 2 feature justified by real usage data today? | YES / NO |
| What is tomorrow's top operating priority? |  |
