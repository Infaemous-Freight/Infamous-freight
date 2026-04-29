#!/usr/bin/env bash
set -euo pipefail

pnpm -r test -- --runInBand
pnpm --filter @infamous-freight/api prisma:generate
pnpm -r build

# Keep Docker validation opt-in strict to support restricted dev containers.
if [[ "${DOCKER_SMOKE_STRICT:-false}" == "true" ]]; then
  DOCKER_SMOKE_STRICT=true bash scripts/docker-smoke-check.sh
else
  bash scripts/docker-smoke-check.sh
fi
