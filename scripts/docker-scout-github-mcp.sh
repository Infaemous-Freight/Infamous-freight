#!/usr/bin/env bash
set -Eeuo pipefail

REGISTRY="${1:-}"
IMAGE="${2:-ifamousfreight/dhi-github-mcp:0}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for registry login, pull, and scout CVE scan." >&2
  echo "Install Docker on Ubuntu with: bash scripts/install-docker-ubuntu.sh" >&2
  exit 1
fi

if ! docker scout --help >/dev/null 2>&1; then
  echo "Docker Scout is required but not available in this Docker installation." >&2
  echo "Reinstall Docker with Docker's official packages (includes Scout plugin)." >&2
  exit 1
fi

if [[ -n "${REGISTRY}" ]]; then
  echo "==> Logging into ${REGISTRY}"
  docker login "${REGISTRY}"
else
  echo "==> Skipping docker login (no registry argument provided)"
fi

echo "==> Pulling ${IMAGE}"
docker pull "${IMAGE}"

echo "==> Running Docker Scout CVE scan for ${IMAGE}"
docker scout cves "${IMAGE}"
