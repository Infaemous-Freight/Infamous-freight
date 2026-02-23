# Security Architecture

## Authentication
- JWT (RS256)
- Rotating signing keys
- HTTP-only cookies
- CSRF protection

## Authorization
- RBAC middleware
- Tenant validation
- Postgres RLS

## Encryption
- At-rest: AES-256 (RDS encryption)
- In-transit: TLS 1.3

## Audit Logging

**Audit table:**
- `id`
- `tenant_id`
- `user_id`
- `action_type`
- `entity_type`
- `entity_id`
- `timestamp`
- `ip_address`

All financial + dispatch changes logged.
