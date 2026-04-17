#!/usr/bin/env bash
set -Eeuo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Install Docker to run dhi.io/github-mcp." >&2
  exit 1
fi

if [ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
  echo "GITHUB_PERSONAL_ACCESS_TOKEN is required." >&2
  echo "Example: export GITHUB_PERSONAL_ACCESS_TOKEN=your-personal-access-token" >&2
  exit 1
fi

docker run --rm -i \
  -e GITHUB_PERSONAL_ACCESS_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN}" \
  ${GITHUB_API_URL:+-e GITHUB_API_URL="${GITHUB_API_URL}"} \
  dhi.io/github-mcp
