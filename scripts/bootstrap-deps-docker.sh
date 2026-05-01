#!/usr/bin/env bash
set -euo pipefail

pnpm install --frozen-lockfile

# Ensure prisma client is generated even when package-manager build scripts are disabled.
pnpm run prisma:generate

# Ensure Docker CLI is installed, then validate daemon availability.
if INSTALL_DOCKER=true bash scripts/install-docker-cli.sh; then
  echo "Docker CLI/daemon check: PASS"
else
  echo "Docker CLI/daemon check: WARN (not available in this environment)"
fi
