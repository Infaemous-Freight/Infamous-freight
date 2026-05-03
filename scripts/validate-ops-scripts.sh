#!/usr/bin/env bash
set -euo pipefail

scripts=(
  scripts/install-docker-cli.sh
  scripts/install-required-clis.sh
  scripts/bootstrap-deps-docker.sh
  scripts/bootstrap.sh
  scripts/smoke-api-health.sh
  scripts/production-snapshot.sh
)

for script in "${scripts[@]}"; do
  bash -n "$script"
  echo "validated: $script"
done
