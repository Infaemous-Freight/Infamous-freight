#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PKG_CMD="npm"
if command -v pnpm >/dev/null 2>&1; then
  PKG_CMD="pnpm"
fi

echo "[validate] Installing dependencies"
if [[ "$PKG_CMD" == "pnpm" ]]; then
  pnpm install --frozen-lockfile=false
else
  npm ci
fi

echo "[validate] Generating Prisma client when API schema exists"
if [[ -f "apps/api/prisma/schema.prisma" ]]; then
  $PKG_CMD run prisma:generate
else
  echo "[validate] Skipping prisma generate (apps/api/prisma/schema.prisma not found)"
fi

echo "[validate] Lint"
$PKG_CMD run lint

echo "[validate] TypeScript check (web)"
if [[ -f "apps/web/tsconfig.json" ]]; then
  (cd apps/web && npx tsc --noEmit)
fi

echo "[validate] Tests"
if [[ -f "apps/api/package.json" ]]; then
  if [[ "$PKG_CMD" == "pnpm" ]]; then
    pnpm --dir apps/api run test -- --runInBand
  else
    npm --prefix apps/api run test -- --runInBand
  fi
else
  $PKG_CMD run test
fi

echo "[validate] Build"
$PKG_CMD run build
