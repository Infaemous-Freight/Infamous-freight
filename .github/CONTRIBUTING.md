# Contributing to Infamous Freight

## Local setup
1. Open the repo in the devcontainer.
2. Install hooks:
   - `pnpm hooks:install`
3. Validate before push:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test -- --runInBand`
   - `pnpm build`

## Commit format
Use conventional commits.

Examples:
- `feat(api): add shipment event logging`
- `fix(web): prevent invalid load status transition`
- `chore(ci): harden dependency review workflow`

## Rules
- Do not weaken auth, RBAC, or tenant isolation.
- Do not remove validation to make tests pass.
- Do not commit secrets.
- Keep patches narrow and root-cause focused.
