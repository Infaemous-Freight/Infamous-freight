#!/usr/bin/env bash
set -euo pipefail

FORCE=0

if [[ "${1-}" == "--force" ]]; then
  FORCE=1
  REPO_NAME="${2:-infamous-freight}"
else
  REPO_NAME="${1:-infamous-freight}"
fi

if [[ -d "$REPO_NAME" && $FORCE -ne 1 ]]; then
  if [[ -n "$(ls -A "$REPO_NAME" 2>/dev/null || true)" ]]; then
    echo "Error: Directory '$REPO_NAME' already exists and is not empty. Re-run with --force to overwrite." >&2
    exit 1
  fi
fi
mkdir -p "$REPO_NAME"
cd "$REPO_NAME"

cat > package.json <<JSON
{
  "name": "${REPO_NAME}",
  "private": true,
  "packageManager": "pnpm@10.15.0",
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "db:up": "docker compose up -d",
    "db:down": "docker compose down"
  },
  "devDependencies": {
    "turbo": "^2.0.14",
    "prettier": "^3.3.3",
    "typescript": "^5.6.3"
  }
}
JSON

cat > pnpm-workspace.yaml <<'YAML'
packages:
  - "apps/*"
  - "packages/*"
YAML

cat > turbo.json <<'JSON'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "lint": { "dependsOn": ["^lint"] }
  }
}
JSON

cat > docker-compose.yml <<'YAML'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: infamous
      POSTGRES_PASSWORD: infamous
      POSTGRES_DB: infamous
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  pgdata:
YAML

mkdir -p apps/api/src/{middleware,routes,services,worker,jobs,queue,integrations/stripe,lib} apps/api/prisma
mkdir -p packages/shared/src apps/web apps/mobile

cat > packages/shared/package.json <<'JSON'
{
  "name": "@infamous/shared",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "zod": "^3.23.8"
  }
}
JSON

cat > packages/shared/src/index.ts <<'TS'
export * from './types';
TS

cat > packages/shared/src/types.ts <<'TS'
import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PLATFORM_FEE_BPS: z.coerce.number().default(300)
});

export type AppEnv = z.infer<typeof EnvSchema>;

export const RoleSchema = z.enum([
  'OWNER',
  'ADMIN',
  'BROKER',
  'DISPATCHER',
  'CARRIER_ADMIN',
  'DRIVER',
  'SHIPPER',
  'FINANCE',
  'READONLY'
]);

export type UserRole = z.infer<typeof RoleSchema>;
TS

cat > apps/api/.env.example <<'ENV'
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://infamous:infamous@localhost:5432/infamous
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_super_secret_change_me
PLATFORM_FEE_BPS=300
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ENV

cat > README.md <<'MD'
# Infamous Freight Scaffold

This scaffold bootstraps a multi-tenant freight SaaS starter with:

- PNPM + Turbo monorepo
- API/shared/web/mobile workspace layout
- Postgres + Redis docker-compose
- Environment template for API

## Usage

```bash
bash scripts/generate-saas-scaffold.sh
cd infamous-freight
pnpm i
pnpm db:up
cp apps/api/.env.example apps/api/.env
```
MD

echo "✅ Scaffold created at ./$REPO_NAME"
