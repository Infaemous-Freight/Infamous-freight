# Infamous Freight

[![CI](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/ci.yml)
[![CodeQL](https://github.com/MrMiless44/Infamous-freight/actions/workflows/codeql.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/codeql.yml)
[![Security Audit](https://github.com/MrMiless44/Infamous-freight/actions/workflows/security-audit.yml/badge.svg)](https://github.com/MrMiless44/Infamous-freight/actions/workflows/security-audit.yml)

Infamous Freight is a logistics and freight operations platform organized as a pnpm monorepo with API, web, mobile, and shared workspace packages.

## Workspace Layout

```text
apps/
  api/       Express API
  web/       Next.js operations dashboard
  mobile/    Expo / React Native mobile app

packages/
  shared/    shared types and utilities
```

## Tooling Requirements

- Node.js 22.x
- pnpm 9.x

This repository pins:

- `node`: `22.x`
- `pnpm`: `9.x`
- `packageManager`: `pnpm@9.15.0`

## Local Setup

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate

git clone https://github.com/MrMiless44/Infamous-freight.git
cd Infamous-freight

cp .env.example .env
pnpm install
pnpm build
```

## Development

### API

```bash
pnpm dev
# or
pnpm dev:api
```

### Web

```bash
pnpm dev:web
```

### Mobile

```bash
pnpm dev:mobile
```

## Quality Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm validate
```

## Notes

- The root `dev` script starts the API workspace.
- The shared package is built before recursive build, typecheck, and test commands.
- Environment values should be supplied via `.env` locally and provider secrets in CI / deployment platforms.
- Never commit secrets into workflow files or tracked config.
