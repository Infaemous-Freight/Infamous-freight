#!/usr/bin/env bash
# Run all primary services concurrently.
# Requires pnpm to be available in PATH.
set -euo pipefail

command -v pnpm >/dev/null 2>&1 || {
  echo "pnpm not found. Run 'corepack enable && corepack prepare pnpm@9.15.0 --activate' first."
  exit 1
}

echo "==> Starting all services (api, web, mobile)"
echo "    Press Ctrl+C to stop all services."
echo ""

# Use pnpm's built-in parallel run support if available, otherwise use simple background processes.
if command -v npx >/dev/null 2>&1; then
  npx concurrently \
    --names "api,web,mobile" \
    --prefix-colors "cyan,green,yellow" \
    "pnpm run dev:api" \
    "pnpm run dev:web" \
    "pnpm run dev:mobile"
else
  # Fallback: run in background with simple output labeling
  pnpm run dev:api &
  API_PID=$!

  pnpm run dev:web &
  WEB_PID=$!

  pnpm run dev:mobile &
  MOBILE_PID=$!

  echo "api    PID: $API_PID"
  echo "web    PID: $WEB_PID"
  echo "mobile PID: $MOBILE_PID"

  trap "kill $API_PID $WEB_PID $MOBILE_PID 2>/dev/null || true" INT TERM EXIT
  wait
fi
