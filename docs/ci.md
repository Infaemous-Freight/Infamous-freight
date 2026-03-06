# CI Contract

This document defines the runtime contract, required checks, and merge rules for the Infamous Freight repository.

## Runtime Contract

| Constraint      | Value       |
| --------------- | ----------- |
| Node.js version | `20.x`      |
| pnpm version    | `9`         |
| Package manager | pnpm only   |

- `.nvmrc` pins Node to `20`.
- `package.json` `engines.node` enforces `20.x`.
- `package.json` `packageManager` enforces `pnpm@9`.
- No `package-lock.json` or `yarn.lock` files are permitted.

## Required Scripts

| Script        | Command                          | Purpose                            |
| ------------- | -------------------------------- | ---------------------------------- |
| `ci:sanity`   | `pnpm install --frozen-lockfile` | Deterministic install from lockfile |
| `build`       | `pnpm -r --if-present build`     | Build all workspace packages       |
| `test`        | `pnpm -r --if-present test`      | Run all tests                      |
| `lint`        | `pnpm -r --if-present lint`      | Lint all packages                  |
| `typecheck`   | `pnpm -r exec tsc --noEmit`      | TypeScript type checking           |

## Workflows

### `ci-sanity.yml` — Sanity Check

Lightweight pipeline that validates the dependency install succeeds with the frozen lockfile. Runs on push to `main`/`master` and on pull requests.

**Jobs:**
1. `sanity` — Checks out code, sets up pnpm and Node 20, runs `pnpm install --frozen-lockfile`.

### `ci.yml` — CI

Full CI pipeline: lint, typecheck, test, build. Runs on push to `main` and on pull requests.

### `security.yml` — Security Scanning

Dependency audit and SAST. Runs on push to `main` and on pull requests.

### `repo-structure.yml` — Repository Structure

Validates repository conventions and structure. Runs on push to `main` and on pull requests.

## Branch Protection Rules

The `main` branch enforces the following rules (see `.github/branch-protection-rules.json`):

- **Required approvals:** 1 approving review
- **Code owner review required:** yes
- **Dismiss stale reviews:** yes
- **Admin enforcement:** yes
- **Require conversation resolution:** yes
- **Require linear history:** yes
- **No force pushes:** enforced
- **No deletions:** enforced

### Required Status Checks

All of the following checks must pass before merging to `main`:

- `CI Sanity / sanity`
- `CI / Lint, Typecheck, Test, Build`
- `CodeQL / Analyze`
- `Dependency Review / dependency-review`

## Local Development

Reproduce the CI sanity check locally:

```bash
pnpm run ci:sanity
```

Ensure you are running Node 20 (use `nvm use` with `.nvmrc`):

```bash
nvm use
node --version  # should print v20.x.x
```
