# invoice-service

## Purpose
Scaffold for the invoice-service domain in the V3 Freight Intelligence architecture.

## Runtime Responsibilities
- Expose internal API contracts.
- Publish/consume domain events.
- Own service-local persistence schema.
- Emit OpenTelemetry traces and structured logs.

## Initial Backlog
- [ ] Bootstrap service runtime package.
- [ ] Define protobuf/OpenAPI contracts.
- [ ] Implement health/readiness endpoints.
- [ ] Add CI checks and smoke tests.
- [ ] Wire secrets from Vault and mTLS certificates.
