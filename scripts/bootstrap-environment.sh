#!/usr/bin/env bash
set -euo pipefail

echo "==> Validating required tooling"
required_tools=(node npm git)
for tool in "${required_tools[@]}"; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing required tool: $tool"
    exit 1
  fi
done

echo "==> Optional tooling checks"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "Warning: pnpm is not installed (npm workspace scripts still work)."
fi
if ! command -v docker >/dev/null 2>&1; then
  echo "Warning: docker is not installed (container build/deploy commands unavailable)."
fi

echo "==> Installing workspace dependencies"
npm install

echo "==> Running full verification"
npm run verify:all

echo "Environment bootstrap complete."
