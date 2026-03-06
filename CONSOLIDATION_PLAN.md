# Consolidation Plan

## Goal

Reduce top-level ambiguity without breaking active workflows.

## Priority 1 — compliance
Canonical target:
- `@compliance/`

Actions:
- move reusable compliance code, schemas, and APIs into `@compliance/`
- leave `compliance/` only for transitional assets not yet migrated
- add deprecation guidance in `compliance/README.md`

## Priority 2 — AI split
Canonical targets:
- `apps/ai` for TypeScript app-layer runtime
- `ai/` for Python/ML model-serving systems

Actions:
- document the boundary clearly
- do not duplicate business logic across both locations
- move shared contracts into `packages/shared` where possible

## Priority 3 — performance testing
Canonical target:
- `k6/`

Actions:
- inventory `load-tests/` and `tools/load-tests/`
- migrate active scenarios into `k6/`
- keep only tooling/wrappers in `tools/load-tests/` when necessary

## Priority 4 — observability
Canonical boundary:
- `monitoring/` = dashboards, alerts, probes
- `observability/` = logs, traces, metrics instrumentation

Actions:
- move mixed content to the correct side
- add small READMEs in both roots

## Priority 5 — infrastructure
Canonical rule:
- tool-specific infra roots may remain, but purpose must be documented

Actions:
- add READMEs in `deploy/`, `docker/`, `k8s/`, `terraform/`, `infrastructure/`, `nginx/`, and `supabase/`
- document ownership and intended use

## Priority 6 — satellite projects
Canonical rule:
- standalone satellite roots must justify why they are not under `apps/`, `services/`, or `tools/`

Actions:
- add a short README in each satellite project root
- document runtime/ownership/deployment boundaries
