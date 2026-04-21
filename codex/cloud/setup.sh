#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

corepack enable >/dev/null 2>&1 || true

PKG_CMD="npm"
if command -v pnpm >/dev/null 2>&1; then
  PKG_CMD="pnpm"
fi

echo "[setup] Installing dependencies"
if [[ "$PKG_CMD" == "pnpm" ]]; then
  pnpm install --frozen-lockfile=false
else
  npm ci
fi

echo "[setup] Preparing Prisma client when schema exists"
if [[ -f "apps/api/prisma/schema.prisma" ]]; then
  $PKG_CMD run prisma:generate
else
  echo "[setup] Skipping prisma generate (apps/api/prisma/schema.prisma not found)"
fi

echo "[setup] Cloud environment is ready for validation (lint/test/build)."
