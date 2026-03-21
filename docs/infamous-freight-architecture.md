# Infamous Freight Architecture

## Goal
Build the platform in strict dependency order so identity and tenancy foundations are complete before higher-order modules are layered on top.

## Execution Order
1. Authentication
2. Organizations and memberships
3. Tenant isolation
4. RBAC

## System Boundaries
- **API**: `apps/api` Express + TypeScript service that owns auth, tenant-aware business routes, and Prisma persistence.
- **Database**: PostgreSQL via Prisma. Auth data is the authoritative identity source.
- **Clients**: Web/mobile clients authenticate with short-lived access tokens and refresh sessions.
- **Security boundary**: Every protected request resolves the authenticated user, active session, tenant context, and role claims before business logic executes.

## Core Auth Decisions
- Use email + password for first-party login.
- Store passwords as bcrypt hashes only.
- Use short-lived JWT access tokens for API auth.
- Use database-backed refresh sessions so logout and rotation can invalidate server-side state.
- Never return password hashes in API responses.
- Registration creates the first tenant and first user together.
- `/api/auth/me` always resolves from the authenticated access token and database user record.

## Data Model Foundations
- `Tenant`: the initial top-level account boundary.
- `User`: identity record scoped to a tenant for Module 1.
- `AuthSession`: refresh-token session store with expiry, revocation, and rotation metadata.

## API Surface for Module 1
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Validation and Error Rules
- Validate every payload with Zod.
- Return `400` for invalid input, `401` for invalid credentials/session, `409` for duplicate email, and `500` only for unexpected server failures.
- Normalize emails to lowercase.
- Strip secrets from all API responses.

## Dependency Guardrails
- Module 2 must not begin until Module 1 passes local validation for register, login, refresh, logout, and current-user retrieval.
- Module 3 depends on stable tenant ownership from Modules 1-2.
- Module 4 depends on membership and tenant primitives from Modules 2-3.
