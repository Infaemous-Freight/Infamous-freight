#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  echo ""
  echo "Stopping dev processes..."
  kill 0
}

trap cleanup EXIT INT TERM

pnpm dev &
pnpm dev:web &
pnpm dev:mobile &

wait
