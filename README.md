# Infamous Freight

![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-App-000000?logo=next.js&logoColor=white)
![AI Powered](https://img.shields.io/badge/AI-Powered-22C55E)
![Logistics](https://img.shields.io/badge/Freight-Logistics-0EA5E9)
![Monorepo](https://img.shields.io/badge/Monorepo-pnpm-F69220?logo=pnpm&logoColor=white)

[![CI](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml)
[![Sanity CI](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci-sanity.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci-sanity.yml)
[![Security](https://github.com/MrMiless44/Infamous-freight/actions/workflows/security.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/security.yml)
[![Repo Structure](https://github.com/MrMiless44/Infamous-freight/actions/workflows/repo-structure.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/repo-structure.yml)

AI-powered freight and logistics automation platform with real-time tracking, carrier networks, and intelligent load orchestration.

**Alternative brand-forward version**

Infamous Freight — an AI-powered logistics platform connecting shippers, brokers, and carriers with real-time automation and smart load matching.

**GitHub topics**

`logistics`, `freight`, `supply-chain`, `saas`, `ai`, `nextjs`, `typescript`, `kubernetes`, `automation`, `transportation`

This repository is a platform monorepo containing product applications, shared packages,
AI/ML services, operational tooling, infrastructure code, compliance domains,
testing systems, and developer automation.

## Canonical repository map

### Runtime applications
- `apps/` — first-class runnable product applications
  - `apps/api` — backend API
  - `apps/web` — web application
  - `apps/mobile` — mobile application
  - `apps/worker` — background jobs / async processing
  - `apps/ai` — TypeScript app-layer AI runtime, if used

### Shared code
- `packages/` — reusable internal packages
  - `packages/shared` — contracts, constants, schemas, utilities
  - `packages/genesis` — Genesis avatar / assistant package

### Standalone services and platform domains
- `services/` — standalone service domains
- `payments/` — payments-specific logic and integrations
- `ai/` — standalone AI / ML service runtime, especially Python-based inference

### Compliance and security
- `@compliance/` — canonical compliance code domain
- `compliance/` — transitional or legacy compliance content
- `.security/` — security policy, incident response, and reporting docs

### Infrastructure and deployment
- `docker/` — local container orchestration and service Dockerfiles
- `deploy/` — deployment scripts and release mechanics
- `infrastructure/` — shared infra assets not tied to a single tool
- `k8s/` — Kubernetes manifests
- `terraform/` — infrastructure as code
- `nginx/` — proxy/edge config
- `supabase/` — Supabase-specific assets

### Testing and validation
- `tests/` — shared integration/system tests
- `e2e/` — end-to-end tests
- `k6/` — canonical performance/load testing
- `load-tests/` — transitional performance tests
- `tools/load-tests/` — load-testing tooling
- `validation-data/` — validation datasets and fixtures

### Operations and observability
- `monitoring/` — dashboards, health checks, alerting assets
- `observability/` — telemetry, traces, logs, metrics instrumentation
- `ops/` — operational runbooks and procedures

### Developer control plane
- `.codex` — AI coding-agent guardrails
- `.devcontainer/` — development container setup
- `.github/` — repo automation and governance
- `.husky/` — canonical git hooks
- `.vscode/` — workspace defaults

### Supporting roots
- `docs/` — canonical documentation
- `configs/` — shared configuration assets
- `scripts/` — repo scripts and automation
- `examples/` — example usage and demos
- `eslint-rules/` — custom lint rules
- `plugins/` — custom plugins, including eslint plugins
- `public/` — public assets
- `media/` — media assets
- `Infamous-Freight-Firebase-Studio/` — dedicated subproject
- `infamous-freight-copilot-orchestrator/` — dedicated subproject
- `infamous-freight-gh-app/` — dedicated subproject
- `my-neon-app/` — dedicated subproject

## Canonical rules

1. `apps/` is the primary home for runnable product applications.
2. `packages/` is the primary home for reusable TypeScript libraries.
3. `ai/` is the primary home for standalone Python/ML services.
4. `@compliance/` is the canonical home for compliance code and schemas.
5. `k6/` is the preferred home for load/performance scenarios.
6. Infrastructure may remain split by tool, but every infra root must be documented.
7. New top-level directories require justification, ownership, and a README.

## Fast start

### Install
```bash
pnpm install
```

### Run core apps
```bash
pnpm dev:api
pnpm dev:web
pnpm dev:worker
```

### Run quality checks
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Required reading
- `ARCHITECTURE.md`
- `REPO_MAP.md`
- `OWNERSHIP.md`
- `CONSOLIDATION_PLAN.md`
- `CONTRIBUTING.md`
