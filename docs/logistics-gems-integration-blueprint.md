# Infæmous Freight — Logistics Gems Integration Blueprint

_Last updated: June 2026._

This blueprint defines how Infæmous Freight should use proven open-source logistics projects without replacing the platform's core product identity, tenant model, billing model, or production security posture.

## Decision summary

| Project | Recommendation | Primary value | Adoption style |
| --- | --- | --- | --- |
| Traccar | Adopt first | GPS tracking, device ingestion, geofencing, location history | External tracking service integrated through API adapters and webhooks |
| GraphHopper | Adopt second | Routing, mileage, ETA, dispatch scoring, backhaul optimization | External routing service integrated through a server-side adapter |
| Fleetbase | Study selectively | Logistics architecture, extension patterns, workflow modeling | Reference architecture only; do not run as a second platform inside production |
| OpenTelemetry Collector | Add when event volume grows | Traces, metrics, logs, operational observability | Optional infrastructure sidecar/service |
| NocoDB | Optional internal ops tool | Lightweight back-office tables for carrier/broker/customer operations | Internal-only admin utility, not customer-facing source of truth |
| Apache Superset | Optional analytics accelerator | Revenue, lane, load, driver, and margin dashboards | Read-only analytics layer on replicated/reporting data |
| Temporal | Future workflow engine | Durable dispatch, billing, compliance, and exception workflows | Introduce only after workflow complexity justifies it |

## Non-goals

- Do not replace Infæmous Freight with Fleetbase.
- Do not expose Traccar or GraphHopper credentials to the browser.
- Do not bypass tenant isolation, paid-access gates, audit logs, or verified JWT auth.
- Do not ingest third-party tracking data directly into public tables without validation and tenant mapping.
- Do not introduce another source of truth for billing, carrier membership, or production load ownership.

---

## Phase 1: Traccar tracking integration

### Business outcome

Add production-grade location visibility without building GPS device protocol support from scratch.

### Target capabilities

- Driver/device registration mapping
- Last known vehicle/driver location
- Shipment tracking timeline enrichment
- Geofence entry/exit events
- Dispatcher map updates
- Customer-safe tracking visibility

### Recommended API module

```text
apps/api/src/tracking/traccar-client.ts
apps/api/src/tracking/traccar-routes.ts
apps/api/src/tracking/tracking-events.ts
```

### Server-side environment variables

```bash
TRACCAR_BASE_URL=https://tracking.example.com
TRACCAR_API_TOKEN=<server-side-token>
TRACCAR_WEBHOOK_SECRET=<webhook-signing-secret>
TRACCAR_SYNC_ENABLED=false
```

### Integration pattern

```text
Traccar devices/events
        ↓
Infæmous API Traccar adapter
        ↓
Tenant + driver/device mapping validation
        ↓
shipmentTracking / geofence event records
        ↓
Dispatch dashboard + public-safe tracking endpoint
```

### First endpoints to add

| Endpoint | Purpose | Auth |
| --- | --- | --- |
| `GET /api/tracking/devices` | List tenant-mapped tracking devices | protected tenant route |
| `POST /api/tracking/devices/:deviceId/link-driver` | Link a Traccar device to an Infæmous driver | owner/admin/dispatcher |
| `GET /api/tracking/drivers/:driverId/location` | Return last known driver location | protected tenant route |
| `POST /api/tracking/traccar/webhook` | Receive signed Traccar events | signed webhook + tenant/device mapping |
| `GET /api/tracking/shipments/:shipmentId/timeline` | Return tenant-safe shipment location timeline | protected tenant route |

### Data model additions

Add these only after confirming the Traccar event payloads and tenant mapping rules:

- `TrackingDevice`
- `DriverTrackingDevice`
- `TrackingEvent`
- `GeofenceEvent`

Each row should include `carrierId` / tenant ownership and an immutable event timestamp.

### Security requirements

- Verify webhook signature before processing.
- Map external device IDs to tenant-owned internal records before writing events.
- Store only normalized event data required for dispatch/tracking.
- Redact raw payloads or store them only in restricted audit/event storage.
- Never expose full device metadata through public shipment tracking.

### Acceptance criteria

- A tenant can link a GPS device to a driver.
- A Traccar event updates internal tracking state.
- A dispatcher can see the driver's last known location.
- A public tracking response exposes only sanitized shipment location/status.
- Cross-tenant access to device/location data is rejected.

---

## Phase 2: GraphHopper routing integration

### Business outcome

Add reliable routing, mileage, ETA, and route-cost inputs for dispatch scoring and analytics.

### Target capabilities

- Route distance and duration
- ETA calculations
- Deadhead mileage
- Dispatch scoring inputs
- Backhaul recommendations
- Lane analytics enrichment

### Recommended API module

```text
apps/api/src/routing/graphhopper-client.ts
apps/api/src/routing/routing-routes.ts
apps/api/src/routing/dispatch-scoring.ts
```

### Server-side environment variables

```bash
GRAPHHOPPER_BASE_URL=https://graphhopper.example.com
GRAPHHOPPER_API_KEY=<server-side-key-if-using-hosted-api>
GRAPHHOPPER_PROFILE=truck
GRAPHHOPPER_ENABLED=false
```

### Integration pattern

```text
Load origin/destination + driver location
        ↓
GraphHopper route/matrix call
        ↓
Distance, duration, ETA, deadhead miles
        ↓
Dispatch scoring engine
        ↓
Recommended driver/load assignment
```

### First endpoints to add

| Endpoint | Purpose | Auth |
| --- | --- | --- |
| `POST /api/routing/preview` | Route preview for a load/lane | protected tenant route |
| `POST /api/routing/eta` | ETA calculation from current location to destination | protected tenant route |
| `POST /api/dispatch/score-load` | Combine route, driver, and load data into dispatch score | owner/admin/dispatcher |
| `POST /api/dispatch/backhaul-candidates` | Rank loads for a driver's projected end location | owner/admin/dispatcher |

### Security requirements

- Do all GraphHopper calls from the API server, not the browser.
- Validate coordinates, addresses, and tenant ownership before scoring.
- Cache route responses when safe to reduce provider cost/latency.
- Treat route outputs as recommendations, not automatic dispatch authority.

### Acceptance criteria

- A dispatcher can preview route distance/duration for a load.
- A dispatch score includes deadhead distance and ETA.
- Route calls fail closed with manual-review recommendations if the provider is unavailable.
- No GraphHopper keys are exposed in frontend bundles.

---

## Phase 3: Fleetbase reference review

Fleetbase is valuable as a reference model, but it should not become a second production platform inside Infæmous Freight.

### Review for patterns only

- Modular logistics extensions
- Order/load lifecycle modeling
- API and webhook conventions
- Dispatch/fleet abstractions
- Internal admin UX patterns

### Do not adopt wholesale unless

- a specific Fleetbase module is isolated,
- licensing has been reviewed,
- tenant and auth behavior is compatible,
- data ownership and billing behavior remain controlled by Infæmous Freight.

---

## Implementation order

1. Add provider config and disabled-by-default feature flags.
2. Add Traccar client and signed webhook receiver behind config gates.
3. Add device-to-driver mapping data model and tenant tests.
4. Add GraphHopper client and route preview endpoint behind config gates.
5. Add dispatch scoring using route distance, driver location, equipment type, and load timing.
6. Add frontend views only after API behavior and tenant isolation tests pass.
7. Add production launch evidence for each provider integration.

---

## Launch evidence to collect

Record evidence in `docs/production-launch-evidence.md` before declaring these integrations production-ready.

| Gate | Evidence required |
| --- | --- |
| Traccar connectivity | API health/check proves server can reach configured Traccar service without exposing token |
| Device mapping | Controlled tenant links a device to a driver |
| Tracking event ingest | Signed webhook event creates internal tracking event |
| Tenant isolation | Tenant A cannot read Tenant B device/location data |
| Public tracking safety | Public tracking exposes sanitized shipment data only |
| GraphHopper connectivity | API health/check proves server can reach routing provider without exposing key |
| Route preview | Controlled load returns distance, duration, and ETA |
| Dispatch score | Controlled load + driver returns explainable score |
| Fallback behavior | Provider outage returns manual-review/fallback response, not a crash |

---

## Recommended readiness impact

| Capability | Current gap addressed | Expected readiness impact |
| --- | --- | --- |
| Traccar | Driver GPS, shipment visibility, geofencing | High |
| GraphHopper | Routing, ETA, dispatch optimization | High |
| Fleetbase review | Workflow/product architecture | Medium |
| OpenTelemetry | Production observability | Medium |
| Superset | Analytics acceleration | Medium |
| Temporal | Durable workflow reliability | High later, not urgent now |

The two highest-leverage integrations are Traccar and GraphHopper because they directly close the remaining operational gaps in tracking, dispatch, route optimization, and customer shipment visibility.
