# Operations

## Deployment environments

- development
- staging
- production

## CI/CD pipeline

CI runs:

1. lint
2. typecheck
3. test
4. build

Deployments are managed via GitHub Actions workflows; some are triggered automatically after CI runs, while others are manually triggered (`workflow_dispatch`) and may run independently of CI status.

## Monitoring

Monitoring includes:

- application logs
- metrics collection
- alerting for service health

## Incident response

Operational incidents follow standard triage:

1. detect
2. isolate
3. mitigate
4. document
