#!/usr/bin/env bash
set -euo pipefail

APP="${1:-}"
if [ -z "${APP}" ]; then
  echo "Usage: scripts/prisma-migrate-fly.sh <fly-app-name>"
  exit 1
fi

echo "Running pnpm prisma:migrate:deploy on Fly app: ${APP}"
fly ssh console --app "${APP}" -C "cd /app/api && pnpm prisma:migrate:deploy"
