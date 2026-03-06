# Repository Architecture

## Purpose

This document defines the canonical structure of the Infamous Freight monorepo.

The goal is to keep a large platform repository legible, enforceable, and safe to evolve.

## System layers

### 1. Product runtime layer
Primary home:
- `apps/`

This layer contains user-facing and runtime entrypoints.

Examples:
- API
- Web
- Mobile
- Worker
- TypeScript app-layer AI runtime

### 2. Shared library layer
Primary home:
- `packages/`

This layer contains reusable internal packages:
- shared contracts
- shared UI
- shared schemas
- shared utilities
- Genesis assistant/avatar package

### 3. Standalone service layer
Primary homes:
- `services/`
- `ai/`
- `payments/`

Use:
- `services/` for standalone service domains
- `ai/` for Python/ML-serving systems and non-app AI runtimes
- `payments/` for payment-specific service logic when separation is required

Rule:
- do not create both `apps/<domain>` and a top-level `<domain>` without documenting the boundary

### 4. Compliance and security layer
Primary homes:
- `@compliance/`
- `.security/`

Rules:
- `@compliance/` owns compliance code, APIs, schemas, and validation logic
- `.security/` owns policy, reporting, and incident-response documentation
- `compliance/` is transitional unless explicitly justified

### 5. Infrastructure layer
Primary homes:
- `docker/`
- `deploy/`
- `infrastructure/`
- `k8s/`
- `terraform/`
- `nginx/`
- `supabase/`

Rule:
- infra may remain tool-split
- every infra root must document purpose, ownership, and when it should be used
- avoid creating additional infra roots without strong tooling justification

### 6. Testing and verification layer
Primary homes:
- `tests/`
- `e2e/`
- `k6/`

Rules:
- `k6/` is the canonical home for performance scenarios
- `load-tests/` and `tools/load-tests/` should converge toward one documented model
- `validation-data/` stores fixtures and datasets, not executable scenarios

### 7. Observability and operations layer
Primary homes:
- `monitoring/`
- `observability/`
- `ops/`

Rules:
- `monitoring/` focuses on dashboards, alerts, probes, and checks
- `observability/` focuses on instrumentation, traces, logs, and metrics pipelines
- `ops/` focuses on human procedures and runbooks

### 8. Project satellite layer
Dedicated roots:
- `Infamous-Freight-Firebase-Studio/`
- `infamous-freight-copilot-orchestrator/`
- `infamous-freight-gh-app/`
- `my-neon-app/`

Rule:
- satellite roots must have a README explaining why they are not under `apps/`, `services/`, or `tools/`

## Canonical decisions

### AI split
- `apps/ai` = TypeScript app/runtime AI surface
- `ai/` = standalone ML/Python inference systems

### Compliance split
- `@compliance/` = canonical compliance code domain
- `compliance/` = transitional/legacy until merged or intentionally retained

### Performance split
- `k6/` = canonical performance scenario home
- `load-tests/` = transitional
- `tools/load-tests/` = tooling/wrappers only

### Infra split
Infra can remain multi-root, but every root must be discoverable through `REPO_MAP.md` and owned through `OWNERSHIP.md`.

## Architectural guardrails

1. Avoid duplicate top-level concepts.
2. Prefer moving code into an existing canonical root over creating a new one.
3. Require a `README.md` for every top-level directory that is not self-evident.
4. Every top-level domain must have an owner in `OWNERSHIP.md`.
5. Every ambiguous domain must have an action item in `CONSOLIDATION_PLAN.md`.
