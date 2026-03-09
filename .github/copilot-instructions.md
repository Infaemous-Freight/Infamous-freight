# Infamous Freight Copilot Instructions

Infamous Freight is an AI-powered logistics SaaS platform.

## Architecture

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Express
- Prisma ORM
- PostgreSQL
- JWT authentication (HMAC via `JWT_SECRET` by default, optional RS256 via JWKS middleware)

### Mobile
- React Native
- Expo

## Monorepo Structure

- `apps/api`
- `apps/web`
- `apps/mobile`
- `packages/shared`

## Coding Standards

- All code must be written in TypeScript where applicable.
- No hardcoded secrets.
- All non-public API endpoints must use the standard middleware stack: limiters → authenticate → requireOrganization → requireScope → auditLog → validators → handleValidationErrors.
- Prisma must be used for database access.
- All new endpoints require unit tests.
- Domain types, constants, and shared helpers must be imported from `@infamous/shared` (do not redefine them locally in API, web, or mobile apps).
- When shared types/constants change, rebuild the shared package before running the API or tests: `pnpm --filter @infamous/shared build` (this updates `packages/shared/dist`).

## Feature Delivery Order

When adding features:

1. Update backend API
2. Update shared types
3. Update frontend UI
4. Update documentation

## Freight Domain Terminology

- Carrier
- Shipper
- Broker
- Load
- Shipment
- Tracking
- Dispatch
- Rate Confirmation

---

## Copilot Behavior Rules

### Scope Control

- Work only within the files and directories directly relevant to the assigned issue or PR.
- Do **not** refactor, reformat, or modify code outside the stated scope, even if improvements are visible.
- Do **not** rename or move files unless the issue explicitly asks for it.
- Limit each PR to a single, focused concern. Split unrelated changes into separate PRs.
- Never touch `.env`, secrets, credentials, or deployment configuration unless explicitly instructed.

### Workspace Boundaries

- Changes to `packages/shared` require a rebuild before dependent apps can be tested: `pnpm --filter @infamous/shared build`.
- `apps/api`, `apps/web`, and `apps/mobile` are independent workspaces — changes in one must not break the others.
- Infrastructure files (`k8s/`, `terraform/`, `deploy/`) are out of scope unless the issue specifically targets them.
- GitHub Actions workflows under `.github/workflows/` must not be altered as a side-effect of feature work.

### Validation Requirements

- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before marking a task complete.
- All new API endpoints must include input validation using the existing validator middleware and Zod schemas from `@infamous/shared`.
- Database queries must always be tenant-scoped. Never add queries that can return rows from other tenants.
- New Prisma schema changes must include a migration file and a rollback consideration.

### PR Reviewability

- Keep PRs small — aim for fewer than 400 lines of diff.
- Each PR must have a clear summary explaining *what* changed and *why*.
- Do not mix dependency updates with feature or fix changes in the same PR.
- Always fill in the pull request template fully, including the Risk Review and Testing sections.
- Tag follow-up work as separate issues rather than including out-of-scope changes in the current PR.

### Security and Safety

- Never commit secrets, API keys, tokens, or credentials to source code.
- Do not introduce raw SQL queries; use Prisma exclusively for database access.
- All user-supplied input must be validated before use.
- Authentication and authorization checks must not be bypassed or weakened.
- Cross-tenant data access must be impossible by construction.
