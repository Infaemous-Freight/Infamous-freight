#!/usr/bin/env bash
set -Eeuo pipefail

DEFAULT_IMAGE="ifamousfreight/dhi-github-mcp:0"
REGISTRY=""
IMAGE="${DEFAULT_IMAGE}"

if [[ $# -ge 1 ]]; then
  if [[ "$1" == *"/"* || "$1" == *":"* ]]; then
    IMAGE="$1"
    REGISTRY="${2:-}"
  else
    REGISTRY="$1"
    IMAGE="${2:-$DEFAULT_IMAGE}"
  fi
fi

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
