#!/usr/bin/env bash
# deploy-nocheck.sh — Build and deploy while bypassing pre-existing TypeScript errors.
# Use only when TS errors are pre-existing and confirmed non-blocking at runtime.
# Track outstanding errors as a separate technical-debt issue.
set -euo pipefail

echo "==> Building shared package..."
pnpm run build:shared

echo "==> Building all apps (TypeScript type errors bypassed)..."
pnpm -r --if-present run build:nocheck

echo "==> Running production dependency audit..."
pnpm run audit:prod

echo "==> Running release smoke checks..."
pnpm run smoke:release

echo "✅ Deploy build complete. Type errors were bypassed — address TS debt separately."
