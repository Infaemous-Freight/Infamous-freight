#!/usr/bin/env bash
set -euo pipefail

echo "==> Building"
pnpm build

echo "==> Typechecking"
pnpm typecheck

echo "==> Linting"
pnpm lint

echo "==> Testing"
pnpm test

echo "All local validation checks passed."
