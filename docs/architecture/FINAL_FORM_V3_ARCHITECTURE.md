# Infæmous Freight Intelligence Architecture (V3 Final Form)

This document turns the V3 final-form blueprint into implementation scaffolding for engineering execution.

## 1) Microservices decomposition

Service boundaries:

- Auth service
- Load service
- Billing service
- Analytics service
- Broker service
- Invoice service
- Scoring service
- Dispatch realtime service
- Ingestion service
- Factoring service

Each service owns:

- A dedicated schema boundary.
- Versioned API contracts (REST/gRPC).
- Domain events.
- Isolated deployment unit.

## 2) Event-driven core

Message bus:

- Primary: Apache Kafka.
- Bootstrap fallback: Redis Streams.

Canonical events:

- `LOAD_CREATED`
- `LOAD_STATUS_UPDATED`
- `INVOICE_GENERATED`
- `BROKER_SCORE_UPDATED`
- `PAYMENT_RECEIVED`

Event catalog source of truth: `infrastructure/eventing/event-catalog.yaml`.

## 3) Real-time dispatch

The realtime dispatch service exposes a WebSocket endpoint for load-state updates and driver telemetry.

Horizontal scale strategy:

- Redis Pub/Sub channel fanout.
- Stateless websocket workers.

Contract reference:

- `services/dispatch-realtime-service/src/websocket-contract.md`

## 4) ELD integration layer

The ingestion service provides adapter-based ELD integrations for providers such as Samsara, Motive, and Geotab.

Interface scaffold:

- `services/ingestion-service/src/adapters/eld-provider.ts`

Output normalization target:

- `telemetry_events` domain stream/table.

## 5) Broker API ingestion engine

Ingestion jobs synchronize:

- Broker credit feeds.
- Load board APIs.
- External market rate indices.

Normalized sinks:

- `broker_external_scores`
- `lane_market_rates`

## 6) Predictive freight rate ML

A dedicated Python FastAPI service serves model inferences.

Implementation scaffold:

- `ai/rate-prediction-service/app.py`
- `ai/rate-prediction-service/requirements.txt`

## 7) Automated factoring marketplace

Factoring workflows:

1. Invoice generated.
2. Offer options returned.
3. Carrier compares rates.
4. Carrier accepts one offer.

Schema scaffold:

- `services/factoring-service/sql/001_create_factoring_offers.sql`

## 8) Data warehouse + BI

Warehouse targets:

- Snowflake / BigQuery / Redshift.

Pipeline pattern:

- CDC from Postgres.
- Ingestion to warehouse.
- dbt transformations.
- BI dashboards (revenue, lane profitability, broker risk, fleet efficiency).

## 9) Security hardening

Required controls:

- Key rotation automation.
- Vault-based secrets management.
- mTLS service-to-service encryption.
- API gateway rate limiting.
- DDoS and WAF protections.
- Continuous vulnerability scanning.

## 10) Observability

Minimum production telemetry:

- OpenTelemetry traces.
- Centralized logs.
- SLA/SLO alerting.
- Service health dashboards.

## Target production topology

Cloudflare (WAF/CDN) → AWS ALB → API Gateway → ECS microservices → RDS/Redis/S3 → Kafka → Warehouse.

Resilience strategy:

- Multi-region active-passive failover.
