#!/usr/bin/env bash
set -euo pipefail

echo "==> Initializing Infamous Freight dev container"

cd "/workspaces/${LOCAL_WORKSPACE_FOLDER_BASENAME:-$(basename "$(pwd)")}" 2>/dev/null || cd "$(pwd)"

echo "==> Toolchain"
node --version
npm --version

if ! command -v pnpm >/dev/null 2>&1; then
  echo "==> Enabling pnpm via corepack"
  corepack enable
  corepack prepare pnpm@9.15.0 --activate
fi

pnpm --version

if [ -f package.json ]; then
  echo "==> Installing workspace dependencies"
  pnpm install --frozen-lockfile || pnpm install
else
  echo "==> No package.json found at repo root; skipping install"
fi

if [ -f pnpm-workspace.yaml ]; then
  echo "==> Detected pnpm workspace"
fi

if [ -f package.json ] && jq -e '.scripts["prisma:generate"]' package.json >/dev/null 2>&1; then
  echo "==> Running Prisma client generation via workspace script"
  pnpm prisma:generate || true
fi

if [ -f package.json ] && jq -e '.scripts.build' package.json >/dev/null 2>&1; then
  echo "==> Build script detected at root"
fi

echo
echo "✅ Dev container initialization complete"
echo
echo "Common commands:"
echo "  pnpm install"
echo "  pnpm lint"
echo "  pnpm typecheck"
echo "  pnpm test -- --runInBand"
echo "  pnpm build"
