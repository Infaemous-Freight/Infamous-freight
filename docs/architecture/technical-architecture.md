# Infamous Freight Technical Architecture

## Platform Overview

Infamous Freight is a monorepo-based logistics platform with three runtime surfaces:

- **API** (`apps/api`) for shipment, dispatch, rate, and orchestration operations.
- **Web** (`apps/web`) for operations, monitoring, and carrier workflows.
- **Mobile** (`apps/mobile`) for field dispatch and driver-facing interactions.

Shared contracts, validation schemas, and common utilities are centralized in `packages/shared` to keep business rules consistent across all clients.

## Architecture Layers

1. **Experience Layer**
   - Web dashboard and mobile app interfaces.
   - Role-aware UX for dispatchers, fleet operators, and carrier admins.
2. **Application Layer**
   - API routing, auth middleware, request orchestration, and domain services.
   - Includes AI command interpretation and workflow execution.
3. **Domain Layer**
   - Shipment lifecycle, carrier lifecycle, dispatch, routing, and pricing logic.
   - Enforced through domain modules and shared schemas.
4. **Data Layer**
   - Operational relational data, event records, and audit trails.
   - Optimized for tenancy, observability, and downstream analytics.
5. **Intelligence Layer**
   - AI orchestration service coordinates recommendations and automations.
   - Outputs are validated against policy and confidence thresholds before execution.

## Service Boundaries

- **Shipment Service**: shipment CRUD, timeline updates, milestone tracking.
- **Carrier Service**: carrier profiles, compliance state, availability.
- **Rate Service**: quote generation, lane pricing, surcharge logic.
- **Dispatch Service**: load matching, assignment recommendations, overrides.
- **Orchestration Service**: coordinates workflows across shipment, carrier, and pricing contexts.

## Logistics Intelligence Flow

1. Ingest demand and telemetry signals.
2. Normalize and validate input payloads.
3. Enrich with lane, carrier, and historical performance context.
4. Score dispatch/routing options with policy constraints.
5. Return recommendations to API/UI for human approval or auto-dispatch.
6. Persist outcomes and emit events for observability and learning loops.

## Security and Reliability

- Centralized auth and authorization middleware on all API routes.
- Request correlation IDs for traceability from UI -> API -> service.
- Structured logging and metrics for latency, throughput, and failure rates.
- Rate limiting and error normalization to protect platform stability.

## Monorepo Growth Path

- Keep runtime apps under `apps/`.
- Keep shared libraries and contracts under `packages/`.
- Keep architecture + operational playbooks under `docs/`.
- Keep deployment assets and IaC under `infrastructure/` (or transitional platform config dirs until fully consolidated).
