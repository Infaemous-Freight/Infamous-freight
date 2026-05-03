#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "# Infamous Freight Snapshot"
echo "Generated: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo

echo "## Toolchain"
echo "- node: $(node -v)"
echo "- pnpm: $(pnpm -v)"
echo

echo "## Checks"

run_check() {
  local name="$1"
  shift
  echo "- running: ${name}"
  if "$@" >/tmp/if-snapshot.log 2>&1; then
    echo "  - status: PASS"
  else
    echo "  - status: FAIL"
    echo "  - output:"
    sed 's/^/    /' /tmp/if-snapshot.log
    return 1
  fi
}

run_optional_check() {
  local name="$1"
  shift

  if ! command -v "$1" >/dev/null 2>&1; then
    echo "- running: ${name}"
    echo "  - status: SKIP"
    echo "  - reason: $1 is not installed in this environment"
    return 0
  fi

  run_check "$name" "$@"
}

run_check "ops script syntax" bash scripts/validate-ops-scripts.sh
run_check "prisma generate" pnpm run prisma:generate
run_check "workspace build" pnpm -r build
run_check "workspace tests (runInBand)" pnpm -r test -- --runInBand
run_check "api smoke health" pnpm run smoke:api:health
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  run_check "docker build" docker build -t infamous-freight-snapshot .
else
  echo "- running: docker build"
  echo "  - status: SKIP"
  echo "  - reason: docker daemon is not reachable in this environment"
fi

echo
echo "## Result"
echo "- overall: PASS"
