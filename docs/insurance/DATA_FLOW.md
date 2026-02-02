# Insurance Data Flow

1. Carrier uploads a certificate via `/insurance/certificates`.
2. Certificate metadata is stored and an `UPLOAD` event is logged.
3. Admin verifies or rejects the certificate.
4. Compliance evaluation aggregates requirements and certificate status.
5. Compliance state is stored and enforcement events are logged.
6. Quote requests are captured for per-load or business policy flows.

## Storage

- Insurance certificates and compliance states live in the primary database.
- Insurance event logs provide immutable evidence for audits.
