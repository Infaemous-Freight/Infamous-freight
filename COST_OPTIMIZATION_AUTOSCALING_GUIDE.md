# Cost Optimization & Auto-Scaling Guide

## 1. Infra Right-Sizing
- Choose instance sizes by P95 CPU/memory during peak + 30% headroom.
- Use vertical auto-scaling only after profiling; prefer horizontal scaling for stateless services.
- Separate workers (queues) from API to scale independently.

## 2. Auto-Scaling Policies
- API: scale on CPU > 65% for 5m or p95 latency > 300ms; scale down when CPU < 30% for 10m.
- Workers: scale on queue depth (messages per worker > 100) or task latency > 2s.
- Database: enable read replicas for heavy reads; keep primary write-optimized.

## 3. PostgreSQL Cost Controls
- Use connection pooling (PgBouncer) to reduce idle connection costs.
- Enable auto-vacuum; set `autovacuum_vacuum_scale_factor` to 0.1, analyze scale factor 0.05.
- Archive cold data to cheaper storage (year+ records to S3/Glacier via ETL).
- Use `pg_stat_statements` to find expensive queries; fix instead of overprovisioning.

## 4. Storage & Backups
- Use lifecycle policies on object storage (transition to Infrequent Access/Glacier after 30/90 days).
- Compress logs/archives (gzip) and rotate daily; retain 30-90 days.
- Enable PITR backups for DB with 7-14 day window; prune old snapshots monthly.

## 5. Caching for Cost Reduction
- Apply Redis cache for hot endpoints (shipments list/detail, dashboard stats).
- CDN for static assets; long cache TTL with content hashing.
- Avoid redundant API calls from web/mobile by client-side caching + ETags.

## 6. Build & CI Efficiency
- Use pnpm cache in CI; `pnpm install --frozen-lockfile --ignore-scripts` where safe.
- Skip e2e on non-main branches; run smoke tests only.
- Parallelize lint/test steps; fail fast.
- Cache Playwright browsers in CI.

## 7. Observability Spend
- Sample traces (10-20%) in production; keep 100% in staging when debugging.
- Log at `info` for business events, `warn` for anomalies, `error` for failures; avoid chatty debug logs in prod.
- Set retention: traces 7-14 days, logs 14-30 days, metrics 30-90 days.

## 8. Auto-Scaling Examples (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 65
    - type: Pods
      pods:
        metric:
          name: http_request_p95_latency_ms
        target:
          type: AverageValue
          averageValue: 300m
```

## 9. Auto-Scaling Examples (Serverless/API Gateway)
- Concurrency limit per function to avoid thundering herd.
- Configure provisioned concurrency for p95 cold-start targets.
- Use async invocations with DLQ for spikes.

## 10. Budgeting & Alerts
- Set monthly budget with alerts at 50/80/100%.
- Alert on unusual cost by service (tag resources: `service=api`, `env=prod`).
- Track per-request cost: (monthly infra cost / monthly request volume).

## 11. Capacity Planning
- Forecast QPS growth (p50/p95) and storage growth; plan 3-6 months out.
- Load test with k6/Locust to validate scaling policies.

## 12. Quick Wins
- Enable gzip/br compression to reduce bandwidth.
- Turn off unused dev/staging at night via schedules.
- Use spot/preemptible nodes for stateless workers.
- Consolidate cron jobs into workers instead of dedicated instances.

## Checklist
- [ ] HPA configured for API and workers with sensible CPU/latency/queue triggers.
- [ ] Read replicas enabled; pooling via PgBouncer.
- [ ] Trace sampling set to 10-20% in prod.
- [ ] CDN + asset hashing enabled; long TTL.
- [ ] Budgets/alerts configured; resources tagged by env/service.
- [ ] Backups lifecycle + storage lifecycle policies in place.
- [ ] CI optimized (caching, reduced matrix on non-main).
