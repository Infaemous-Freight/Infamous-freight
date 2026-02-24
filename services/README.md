# Freight Intelligence Platform Services (V3 Final Form)

This directory contains domain-owned service scaffolding for the **Freight Intelligence Infrastructure Platform**.

## Service Domains

- `auth-service`: Identity, access tokens, scopes, service-to-service auth.
- `load-service`: Load lifecycle, status transitions, assignment metadata.
- `billing-service`: Billing workflows, receivables, payment reconciliation.
- `analytics-service`: Operational analytics APIs and KPI rollups.
- `broker-service`: Broker intelligence, trust scoring inputs, external profile sync.
- `invoice-service`: Invoice generation and invoice state management.
- `scoring-service`: Risk and confidence scoring for brokers and lanes.
- `dispatch-realtime-service`: WebSocket gateway for live dispatch updates.
- `ingestion-service`: ELD adapters + external API normalization pipeline.
- `factoring-service`: Factoring marketplace offers and acceptance flow.

## Platform-wide Service Contract

Each service should own:

1. An isolated data schema.
2. A private API contract (REST/gRPC) with versioning.
3. Domain event producers and consumers.
4. OpenTelemetry traces + structured logs.
5. Security controls (mTLS + scoped authn/authz).

## Event Backbone

- Production target: Apache Kafka.
- Simplified bootstrap: Redis Streams.
- Canonical event catalog: `infrastructure/eventing/event-catalog.yaml`.

## Deployment Pattern

- Containerized service image per domain.
- ECS/Fargate workload with service autoscaling.
- API Gateway northbound entry and internal service mesh east/west.
