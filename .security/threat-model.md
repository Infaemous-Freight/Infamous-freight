# Infamous Freight Threat Model

## Architecture Overview

System components:

- API (Express / Node)
- Web (Next.js)
- Mobile (React Native)
- Database (Prisma / PostgreSQL)
- CI/CD (GitHub Actions)

## Trust Boundaries

1. Internet → API gateway
2. API → database
3. multi-tenant user isolation
4. internal services

## Key Assets

- shipment data
- carrier information
- tenant business data
- authentication tokens
- billing records

## Major Threats

### Authentication attacks

- token forgery
- session hijacking

Mitigation:
- JWT HS256 by default using `JWT_SECRET`
- Optional JWT RS256 validation via JWKS when `AUTH_JWKS_URI` is configured
- secure cookies
- short token TTL

### Multi-tenant isolation failure

- cross-tenant queries

Mitigation:
tenant_id filters in all DB queries.

### Supply chain attacks

- malicious dependency

Mitigation:
Dependabot
dependency review
CodeQL

### Secret exposure

- API keys
- database credentials

Mitigation:
secret scanning
environment variables
vault storage.
