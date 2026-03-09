# System Execution Blueprint

## API Endpoints

Core endpoint groups should map to route modules under `apps/api/src/routes`:

- `GET /api/health` - service and dependency health checks.
- `POST /api/ai/command` - natural language or structured orchestration command execution.
- `GET /api/shipments`, `POST /api/shipments`, `PATCH /api/shipments/:id` - shipment lifecycle operations.
- `POST /api/carriers/rank` - carrier ranking and recommendation.
- `POST /api/rates/predict` - dynamic rate estimation and quote generation.
- `POST /api/dispatch/optimize` - dispatch recommendation or automated assignment execution.

## Database Models

Recommended core models:

- **Company/Tenant**: top-level ownership and access boundary.
- **User**: identity, role, permissions, and auth context.
- **Shipment**: load details, lane metadata, status timeline.
- **Carrier**: credentials, compliance, capacity, and performance metrics.
- **RateQuote**: pricing requests, generated rates, confidence and breakdown.
- **DispatchAssignment**: selected carrier/load match, reason code, operator override.
- **EventLog**: immutable workflow and integration event stream.
- **AuditLog**: security and compliance-relevant action history.

## Event Flows

1. **Shipment Created**
   - API validates payload -> writes shipment -> emits `shipment.created`.
2. **Carrier Availability Updated**
   - Availability feed update -> carrier model update -> emits `carrier.capacity.updated`.
3. **Dispatch Triggered**
   - Dispatch request -> optimization engine -> candidate ranking -> emits `dispatch.recommended`.
4. **Dispatch Confirmed**
   - Human/system approval -> assignment persisted -> emits `dispatch.confirmed`.
5. **Delivery Completed**
   - Shipment status terminal update -> SLA/analytics rollups -> emits `shipment.completed`.

## AI Orchestration Lifecycle

1. Accept command intent and context scope.
2. Validate actor permissions and tenant boundaries.
3. Build execution plan against policy + live data.
4. Simulate/score potential actions.
5. Execute approved action chain.
6. Record decision trace, confidence, and outcome metrics.

## Dispatch Optimization Logic

Dispatch ranking should consider:

- lane and equipment compatibility,
- pickup/delivery timing constraints,
- carrier on-time and claims history,
- current capacity and geographic position,
- estimated gross margin and service-level targets.

Output includes ranked options, explanation metadata, and confidence score to support human-in-the-loop or auto-dispatch modes.
