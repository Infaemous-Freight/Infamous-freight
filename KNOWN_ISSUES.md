# Known Issues & Workarounds

## Performance
- **Large shipment exports**: Exports over 50k rows can exceed 60s. Workaround: export by month; planned fix: background job + email link (ETA: 2 sprints).
- **Cold start latency** on first API call after deploy. Workaround: keep at least 2 warm instances; planned fix: provisioned concurrency.

## AI / Voice
- **AI provider rate limits**: 429s when burst traffic. Workaround: exponential backoff + cache last response; planned fix: provider failover + queued requests.
- **Voice upload size**: Files >10MB rejected. Workaround: compress/trim audio; planned fix: chunked upload with pre-signed URLs.

## Mobile Parity
- **Shipment filters** missing on mobile. Workaround: use web dashboard; planned fix: add filters in next mobile release.
- **MFA enrollment** only available on web. Workaround: enroll via web; planned fix: add mobile MFA screen.

## Observability
- **Jaeger not running locally by default**. Workaround: `docker-compose -f docker-compose.observability.yml up -d`; planned fix: include in `pnpm dev` script.
- **Metrics endpoint requires admin auth**; some dashboards show 401 if token missing. Workaround: login as admin; planned fix: service token for dashboards.

## Data
- **Stale cache** after bulk updates. Workaround: manually clear `shipments:*` cache; planned fix: event-driven cache invalidation.
- **Missing indices** on historical tables may slow reports. Workaround: run `prisma:migrate` for index additions; planned fix: dedicated reporting DB.

## Integrations
- **Sandbox payment gateway** occasionally times out. Workaround: retry with backoff; planned fix: circuit breaker + fallback receipt queue.

## Security
- **MFA optional for non-admins**: Encourage enabling. Planned fix: require MFA for billing operations.

## Scheduling
- **Nightly jobs overlap** during long runs. Workaround: stagger start times; planned fix: distributed lock + job runtime guard.
