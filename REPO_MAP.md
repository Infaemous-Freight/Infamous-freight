# Repository Map

## Developer control plane
- `.codex` — AI coding-agent instructions
- `.devcontainer/` — dev container setup
- `.githooks/` — legacy/transitional hooks path if still present
- `.github/` — repo automation and governance
- `.husky/` — canonical git hooks
- `.security/` — security policies and response docs
- `.vscode/` — editor/workspace defaults

## Product/runtime
- `apps/` — product applications
- `packages/` — shared internal packages
- `services/` — standalone service domains
- `payments/` — payment-specific logic
- `public/` — public assets
- `media/` — media assets

## AI / compliance
- `ai/` — standalone AI/ML services
- `@compliance/` — canonical compliance domain
- `compliance/` — transitional compliance area

## Infrastructure / deploy
- `docker/` — local containers
- `deploy/` — deployment workflows
- `infrastructure/` — shared infrastructure assets
- `k8s/` — Kubernetes manifests
- `terraform/` — Terraform code
- `nginx/` — proxy config
- `supabase/` — Supabase configuration

## Testing / validation / performance
- `tests/` — shared tests
- `e2e/` — end-to-end tests
- `k6/` — canonical load testing
- `load-tests/` — transitional load tests
- `tools/load-tests/` — load-testing tooling
- `validation-data/` — validation datasets

## Operations / observability
- `monitoring/` — dashboards, checks, alerting assets
- `observability/` — telemetry/logging/tracing assets
- `ops/` — runbooks and procedures

## Config / docs / tooling
- `docs/` — canonical documentation
- `configs/` — shared config assets
- `examples/` — examples
- `eslint-rules/` — custom lint rules
- `plugins/` — repo plugins
- `scripts/` — repo automation scripts

## Satellite projects
- `Infamous-Freight-Firebase-Studio/`
- `infamous-freight-copilot-orchestrator/`
- `infamous-freight-gh-app/`
- `my-neon-app/`

## Ambiguous domains to watch
- `ai/` vs `apps/ai`
- `@compliance/` vs `compliance/`
- `k6/` vs `load-tests/` vs `tools/load-tests/`
- `monitoring/` vs `observability/`
- `deploy/` vs `infrastructure/` vs `k8s/` vs `terraform/`
- satellite project roots vs `apps/` / `services/`
