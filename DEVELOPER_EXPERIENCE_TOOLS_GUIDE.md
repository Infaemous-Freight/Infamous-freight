# Developer Experience Tools & Productivity

## 1. Local Environment
- `pnpm dev` runs web+api with hot reload; ensure `packages/shared` built after type changes.
- Add `docker-compose.local.yml` to run Postgres + Redis; expose API 4000, web 3000.
- VS Code tasks: test, lint, typecheck, prisma:migrate, prisma:generate.

## 2. Mock & Fixture Data
- Seed script for local testing: `pnpm --filter api seed` populates demo users, shipments, drivers.
- Mock API server for mobile/web e2e: `pnpm --filter api mock` with canned responses.
- Use MSW (Mock Service Worker) in web for integration tests.

## 3. CLI Utilities
- `pnpm --filter api cli user:create --email ... --role admin` (scaffold a simple commander-based CLI).
- `pnpm --filter api cli token:issue --user <id> --scopes ...` for test tokens.
- `pnpm --filter api cli cache:clear --pattern shipments:*` for cache maintenance.

## 4. Pre-commit Hooks
- Use `lefthook` or `husky` to run lint + typecheck on staged files.
- Optional: `lint-staged` to format with prettier.

## 5. Editor Tooling
- Recommended extensions: Prisma, ESLint, Prettier, Jest, DotENV, GitLens.
- Workspace settings: format on save, eslint.validate for ts/js, editor.rulers at 100.

## 6. API Client SDK Generation
- Generate client from OpenAPI:

```bash
curl http://localhost:4000/api-docs.json > openapi.json
openapi-generator-cli generate -i openapi.json -g typescript-axios -o clients/typescript
```

## 7. DX Patterns
- Fast feedback: `pnpm --filter api test --watch` and `pnpm --filter web test --watch`.
- Storybook for isolated UI (optional): `pnpm --filter web storybook`.
- Hot module reload enabled by default in Next.js dev.

## 8. Observability for Devs
- Local Jaeger/Prometheus/Grafana via `docker-compose.observability.yml`.
- Add request correlation IDs in logs; show correlation ID in error pages for support.

## 9. Feature Flag Workflow
- Add simple flag service (env + remote config) to gate risky changes.
- Allow per-environment defaults; expose `/admin/flags` for admins.

## 10. Onboarding Checklist
- Install Node 22 + pnpm 8.
- Copy `.env.example` → `.env`; set DB/Redis endpoints.
- Run `pnpm install` once; `pnpm dev` to start.
- Run `pnpm lint && pnpm check:types && pnpm test` to verify setup.

## Quick Tasks to Implement
- [ ] Create CLI scaffolding using `commander` under `api/src/cli/index.js` with user/token/cache commands.
- [ ] Add `docker-compose.local.yml` with postgres:14, redis:7, adminer (optional) for local dev.
- [ ] Add lefthook/husky + lint-staged config for pre-commit.
- [ ] Add MSW setup in `web` tests for API mocking.
- [ ] Add basic feature flag service with env overrides and in-memory store.
