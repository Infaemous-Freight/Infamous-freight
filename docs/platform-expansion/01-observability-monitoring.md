# Area 1 — Observability & Monitoring

## Objectives

- Establish full-stack telemetry coverage across API, worker, web, and mobile surfaces.
- Reduce mean-time-to-detect (MTTD) and mean-time-to-resolve (MTTR).
- Enable SLO-driven operational governance.

## Scope

### In Scope

- Structured logs with correlation IDs.
- Distributed tracing across service boundaries.
- Metrics pipeline for infra and application KPIs.
- Alerting, on-call routing, and incident dashboards.

### Out of Scope

- BI/reporting warehouse (handled separately).
- Product analytics experimentation pipelines.

## Reference Architecture

1. **Instrumentation layer** (OpenTelemetry SDKs in API and workers).
2. **Collection layer** (OTel Collector + log forwarder).
3. **Storage/analysis layer** (metrics TSDB, log store, trace backend).
4. **Presentation layer** (Grafana dashboards + alert manager).

## Implementation Plan

### Phase 1: Baseline Telemetry

- Add request IDs and tenant IDs to all logs.
- Publish golden signals for API (`latency`, `traffic`, `errors`, `saturation`).
- Create service health dashboard.

### Phase 2: Tracing & Error Correlation

- Propagate trace context across async jobs and webhook handlers.
- Link logs/errors to trace IDs.
- Add route-level and tenant-level breakdown panels.

### Phase 3: SLOs and Incident Automation

- Define SLOs for critical APIs and event processing.
- Implement burn-rate alerts.
- Add runbook links directly in alert payloads.

## Operational Readiness Criteria

- 95%+ of requests include correlation IDs.
- Critical endpoints have SLOs with alert thresholds.
- Pager/on-call policies mapped for P1/P2 incidents.

## Success Metrics

- MTTD reduced by 40%.
- MTTR reduced by 30%.
- Alert noise ratio below 15% false positives.
