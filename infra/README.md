# Infrastructure

This directory consolidates all infrastructure-related configuration and tooling.

## Structure

| Directory    | Purpose                                          |
|--------------|--------------------------------------------------|
| `deploy/`    | Deployment scripts and platform-specific guides  |
| `k8s/`       | Kubernetes manifests (deployments, HPA, ingress) |
| `nginx/`     | Nginx configuration                              |
| `supabase/`  | Supabase migrations, functions, and RLS policies |
| `terraform/` | Infrastructure-as-Code (AWS/multi-region)        |

## Additional Infra Resources

- `infrastructure/` (root) — Advanced scaling configurations (CDN, multi-region, eventing, Kong, Vault, etc.)
- `monitoring/` (root) — Alerting and observability dashboards
- `observability/` (root) — Grafana smoke-test configs
