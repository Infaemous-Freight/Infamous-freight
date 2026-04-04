#!/usr/bin/env bash
set -euo pipefail

echo "==> Enabling pnpm via Corepack"
corepack enable
corepack prepare pnpm@10.15.0 --activate

if [ -f ".env.example" ] && [ ! -f ".env" ]; then
  echo "==> Creating .env from .env.example"
  cp .env.example .env
fi

echo "==> Installing dependencies"
pnpm install

echo "==> Building shared package and workspaces"
pnpm build

echo ""
echo "Bootstrap complete."
echo "Run one of:"
echo "  pnpm dev"
echo "  pnpm dev:web"
echo "  pnpm dev:mobile"
