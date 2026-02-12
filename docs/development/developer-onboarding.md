# Developer Onboarding Guide

This guide summarizes the essentials for contributing to the Infamous Freight Enterprise monorepo, with links to the most relevant configurations and commands.

## Repository Layout

- **Applications**: `apps/{api,web,mobile}`
- **Shared packages**: `src/packages/shared`
- **End-to-end tests**: `tests/e2e` (Playwright)
- **Configuration**:
  - Docker: `configs/docker`
  - CI/CD: `configs/ci-cd`
  - Linting: `configs/linting`
  - Testing: `configs/testing`
  - Validation: `configs/validation`

## Local Setup

```bash
pnpm install           # Install workspace dependencies
pnpm validate          # HTML, CSS, and JS/TS validation
pnpm lint              # JS/TS linting only
pnpm test              # Workspace tests (package scripts)
pnpm test:coverage     # Coverage (uploads to Codecov in CI)
pnpm test:e2e          # Playwright suite (requires running app stack)
```

### Running Applications

- **Web**: `pnpm --filter infamous-freight-web dev`
- **API**: `pnpm --filter infamous-freight-api dev`
- **Mobile**: `pnpm --filter infamous-freight-mobile start`

### Docker Compose

Compose files live in `configs/docker`:

```bash
docker compose \
  -f configs/docker/docker-compose.yml \
  -f configs/docker/docker-compose.dev.yml up --build
```

## CI/CD Expectations

- **Validation**: `pnpm validate` (HTML/CSS/JS/TS)
- **Linting**: `pnpm lint`
- **Testing**: `pnpm test`
- **Coverage**: `pnpm test:coverage` + Codecov upload
- **Artifacts**: Logs and coverage uploaded when jobs fail

For more detail, see `.github/workflows/ci.yml` and `docs/validation-guide.md`.
