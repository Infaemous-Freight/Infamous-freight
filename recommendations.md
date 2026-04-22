# Infamous Freight Repository Review & Recommendations

_Date reviewed: 2026-04-22 (UTC)_

## Review scope

I reviewed the repository locally with emphasis on:
- README and documentation quality
- Codebase structure and architectural consistency
- CI/CD workflows and deployment artifacts
- Test/lint/build posture
- Recent commit history
- Issue visibility via GitHub CLI (`gh`)

## Constraints encountered

- `gh` was initially unavailable and had to be installed.
- `gh` commands still could not list repository metadata/issues because the environment is not authenticated (`gh auth login` required) and this local clone has no configured `origin` remote.
- Because of that, recommendations related to open issues are based on local evidence only, not issue tracker contents.

---

## Executive summary (highest-priority findings)

1. **Architecture drift is the top risk**: API runtime is currently Express (`src/app.ts`, `src/server.ts`) while most API source files are NestJS-style modules/controllers that are not part of the build target.
2. **Lint/typecheck is red**: `npm run lint` fails with a large volume of TypeScript/NestJS dependency and decorator errors.
3. **Tests are too shallow**: one health test passes, but it does not protect critical flows (auth, tenancy, RBAC, billing idempotency, audit logging).
4. **Documentation is inconsistent with implementation** and likely confusing for contributors/operators.
5. **Monorepo/package-manager strategy is inconsistent**: repo claims/workflow indicate one direction while tooling and lockfiles indicate another.
6. **Deployment config has conflicting ports/runtime assumptions** (3000 vs 3001; `dist/main` vs `dist/server` copy behavior).

---

## Detailed recommendations

## 1) Code quality & architecture

### 1.1 Resolve API framework split (Express vs NestJS)
**Observation**
- Runtime entry point uses Express (`createApp` + `server.ts`).
- Large amount of NestJS-oriented code exists under `apps/api/src/**` and appears stale/uncompiled.
- Build config currently includes only `src/app.ts` and `src/server.ts`.

**Recommendation**
- Decide on one API runtime architecture for production now:
  - **Option A (recommended for short-term stability):** Keep Express as canonical API and move NestJS modules to `/docs/legacy` or archive branch, then remove stale Nest-specific code from active compile/lint paths.
  - **Option B:** Complete migration back to NestJS with full dependency restoration and compile/test coverage.
- Add an ADR (`docs/architecture/adr-xxxx-api-framework.md`) to prevent future drift.

**Impact**
- Restores trustworthy CI signal.
- Reduces onboarding confusion and merge risk.

---

### 1.2 Make lint/typecheck green and enforce as quality gate
**Observation**
- Lint step (`tsc --noEmit`) fails with hundreds of errors, mostly missing NestJS deps and decorator/type errors.

**Recommendation**
- Split TS projects:
  - `tsconfig.runtime.json` for production-compiled code.
  - `tsconfig.experimental.json` for optional/in-progress modules.
- Ensure CI lint checks only production-supported code paths.
- Add incremental plan with strict ownership to eliminate dead code or restore dependencies.

**Impact**
- Prevents false confidence from CI.
- Enables safe refactors and reliable releases.

---

### 1.3 Introduce API module boundaries and dependency rules
**Observation**
- API folder includes many domain directories but unclear coupling rules and lifecycle stage.

**Recommendation**
- Define module boundaries (e.g., auth, loads, billing, compliance, integrations).
- Add import rules (ESLint boundaries or dep-cruise).
- Enforce shared contracts via dedicated `packages/contracts` workspace.

**Impact**
- Reduces cross-module regressions and accidental architecture erosion.

---

## 2) Security, tenancy, and correctness

### 2.1 Tenant isolation and RBAC need enforceable checks
**Observation**
- Current executable app has only `/health` endpoint.
- There is no visible active middleware enforcing tenant scoping/RBAC in runtime path.

**Recommendation**
- Add mandatory request context middleware for `tenantId`, `userId`, and role claims.
- Add Prisma access wrappers requiring tenant filter by default.
- Add route-level policy tests ensuring protected endpoints reject missing/invalid claims.

**Impact**
- Prevents cross-tenant leakage (highest business risk).

---

### 2.2 Audit and AI decision logging should be first-class, automatic
**Observation**
- Schema has `AuditLog`, but no clear end-to-end logging middleware path in active Express runtime.

**Recommendation**
- Add service-level logging abstraction for:
  - security-relevant actions
  - AI-assisted decisions (to `AiDecisionLog` equivalent model)
  - billing actions (idempotency key + event ledger)
- Enforce via integration tests and codeowners checks on billing/auth paths.

**Impact**
- Improves traceability, compliance, and incident response.

---

## 3) Documentation & developer experience

### 3.1 Align README with current implementation
**Observation**
- README says backend is NestJS; runtime package currently uses Express.
- README references some flows that may not exist in current production code path.

**Recommendation**
- Add a “Current production architecture” section with exact status:
  - active API framework
  - active endpoints
  - what is roadmap/legacy/prototype
- Add architecture diagram + repo map (`apps/api`, `apps/web`, `docs`, `scripts`).
- Keep a short “Known gaps” section with owner/date.

**Impact**
- Reduces cognitive load and avoids contributor missteps.

---

### 3.2 Add a CONTRIBUTING guide and runbook set
**Recommendation**
Create:
- `CONTRIBUTING.md` (setup, coding standards, branch strategy, commit conventions)
- `docs/runbooks/local-dev.md`
- `docs/runbooks/release.md`
- `docs/runbooks/incident-response.md`

Include exact commands for npm/pnpm decision, migrations, and smoke tests.

---

## 4) Testing strategy

### 4.1 Expand beyond health endpoint
**Observation**
- Current test suite: one passing health test.

**Recommendation**
- Add test pyramid:
  - Unit: domain services (rate, dispatch, billing utils)
  - Integration: API routes with mocked auth + test DB
  - Contract: schema/DTO compatibility tests for web↔api
  - Smoke: startup + health + DB connection + one protected route
- Add coverage thresholds with per-directory minimums.

**High-value first tests**
1. Auth required on protected routes
2. Tenant filter enforced for all repository reads/writes
3. Billing idempotency event replay behavior
4. Audit/AI-decision logging emission

---

## 5) CI/CD and release hygiene

### 5.1 Fix CI mismatch between “green tests” and “red lint”
**Observation**
- Test passes while lint fails massively; signals are contradictory.

**Recommendation**
- Gate merges on:
  - lint/typecheck (runtime scope)
  - tests (runInBand where stability required)
  - Prisma generate + migration check
  - Docker build smoke
- Publish JUnit + coverage artifacts for visibility.

---

### 5.2 Add PR quality automation
**Recommendation**
- Add PR template requiring:
  - tenant isolation impact assessment
  - RBAC impact
  - migration impact
  - rollback plan
- Add CODEOWNERS for auth, billing, schema, and infra files.

---

## 6) Project structure & package management

### 6.1 Standardize on one package manager
**Observation**
- Repository currently uses npm scripts + lockfile; broader project guidance references pnpm workspaces.

**Recommendation**
- Choose one and enforce via CI:
  - If pnpm: add `pnpm-workspace.yaml`, `pnpm-lock.yaml`, update scripts/docs/workflows.
  - If npm: remove pnpm references from docs and internal guidance.

**Impact**
- Prevents dependency drift and install inconsistencies.

---

### 6.2 Move reusable code into shared packages
**Recommendation**
- Add `packages/` for:
  - `contracts` (API DTOs/zod schemas/types)
  - `config` (env parsing/validation)
  - `logger`
  - `authz` policy helpers

This reduces duplication and keeps tenant/RBAC rules centralized.

---

## 7) Data layer and schema recommendations

### 7.1 Add tenancy primitives at schema level
**Observation**
- Core models use `carrierId`; good start, but consistency and constraints can be stronger.

**Recommendation**
- Standardize naming (`tenantId` vs `carrierId`) with clear semantic policy.
- Add compound indexes for common tenant-scoped access patterns.
- Add unique constraints that include tenant dimension where applicable.

---

### 7.2 Add migration governance
**Recommendation**
- Enforce migration naming conventions + review checklist.
- Add migration CI check that applies/reverts on ephemeral DB.
- Add seed strategy per environment (dev/test/staging).

---

## 8) Deployment and runtime reliability

### 8.1 Resolve port/runtime inconsistencies
**Observation**
- Multiple artifacts reference different ports (`3000`, `3001`) and possibly differing entry points.

**Recommendation**
- Standardize:
  - API bind port in all places (Dockerfiles, app startup, Fly config, health checks)
  - Dist entrypoint naming (`dist/main.js` vs copied `dist/server.js`)
- Add startup smoke script run in CI container.

---

### 8.2 Add explicit readiness/liveness strategy
**Recommendation**
- Keep `/health` for liveness.
- Add `/ready` to verify DB + critical dependencies.
- Make Fly/Vercel checks use readiness appropriately.

---

## 9) Product feature delivery recommendations

### 9.1 Prioritize shipping a secure core slice over broad module surface
Given current drift, focus next milestone on a narrow production-grade path:
1. Auth/session verification
2. Tenant-scoped CRUD for 1-2 core entities (e.g., loads + invoices)
3. RBAC enforcement
4. Billing idempotency primitives
5. Audit/AI decision logging hooks

Defer integration-heavy modules until core stability is proven.

---

## 10) GitHub governance improvements

### 10.1 Repository metadata hygiene
**Observation**
- Local clone has no `origin` remote configured.
- `gh` could not retrieve issues/repo details in current environment.

**Recommendation**
- Ensure contributor setup includes remote bootstrap instructions and optional `gh auth login` for maintainers.
- Add labels/milestones aligned to architecture priorities (auth, tenant isolation, RBAC, config, shared contracts, audit, error handling).
- Introduce weekly “stability board” issue triage.

---

## Suggested 30-day action plan

### Week 1
- Decide/record API framework direction (Express vs NestJS).
- Make lint/typecheck green for production scope.
- Standardize port/runtime contract and Docker health checks.

### Week 2
- Implement auth context + tenant enforcement middleware.
- Add RBAC guards/policy tests for first protected routes.
- Introduce shared config validation package.

### Week 3
- Add billing idempotency + audit/AI decision logging primitives.
- Expand integration tests for tenant/RBAC/billing-critical paths.

### Week 4
- Documentation refresh (README + CONTRIBUTING + runbooks).
- CI hardening (artifacts, thresholds, smoke checks).
- Open tracked epics/issues for deferred integrations.

---

## Quick wins checklist

- [ ] Fix README framework mismatch
- [ ] Green `npm run lint` by narrowing scope or removing dead/stale code
- [ ] Add `/ready` endpoint
- [ ] Add at least 5 integration tests for auth/tenant/RBAC
- [ ] Standardize Docker/API port to one value
- [ ] Add CONTRIBUTING + CODEOWNERS + PR template
- [ ] Decide and enforce npm vs pnpm

