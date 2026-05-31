#!/usr/bin/env bash
set -euo pipefail

# Applies committed Prisma migrations to the configured production database.
# This script intentionally never prints DATABASE_URL or other secret values.
# Run only from an authenticated operator terminal with production DATABASE_URL set.

if [[ "${-}" == *x* ]]; then
  set +x
  echo "⚠️  Disabled shell xtrace so migration commands do not echo environment details." >&2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
schema_path="apps/api/prisma/schema.prisma"

cd "${REPO_ROOT}"

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "❌ Missing required command: ${cmd}" >&2
    exit 1
  fi
}

require_command pnpm

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set. Refusing to run production migrations without an explicit database target." >&2
  exit 1
fi

if [[ "${DATABASE_URL}" != postgres://* && "${DATABASE_URL}" != postgresql://* ]]; then
  echo "❌ DATABASE_URL must be a postgres:// or postgresql:// URL." >&2
  exit 1
fi

if [[ ! -f "${schema_path}" ]]; then
  echo "❌ Missing Prisma schema at ${schema_path}." >&2
  exit 1
fi

echo "Validating database URL shape without printing secrets..."
bash scripts/check-database-url.sh

echo "Validating Prisma schema..."
pnpm run prisma:validate

echo "Checking migration status before deploy..."
if ! pnpm -C apps/api exec prisma migrate status --schema prisma/schema.prisma; then
  echo "⚠️  Pre-deploy migration status returned non-zero. Continuing to prisma migrate deploy; deploy will fail on failed or unsafe migration states." >&2
fi

echo "Applying committed Prisma migrations with prisma migrate deploy..."
pnpm -C apps/api exec prisma migrate deploy --schema prisma/schema.prisma

echo "Checking migration status after deploy..."
pnpm -C apps/api exec prisma migrate status --schema prisma/schema.prisma

echo "✅ Production Prisma migration deploy completed. No secret values were printed."
