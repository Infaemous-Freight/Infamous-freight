#!/usr/bin/env bash
set -Eeuo pipefail

IMAGE="${GITHUB_MCP_IMAGE:-ifamousfreight/dhi-github-mcp:latest}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Install Docker to run ${IMAGE}." >&2
  exit 1
fi

if [ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
  echo "GITHUB_PERSONAL_ACCESS_TOKEN is required." >&2
  echo "Example: export GITHUB_PERSONAL_ACCESS_TOKEN=your-personal-access-token" >&2
  exit 1
fi

docker run --rm -i \
  -e GITHUB_PERSONAL_ACCESS_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN}" \
  -e GITHUB_API_URL="${GITHUB_API_URL:-}" \
  "${IMAGE}"
