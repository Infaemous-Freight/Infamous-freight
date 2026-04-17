#!/usr/bin/env bash
set -Eeuo pipefail

IMAGE="${1:-ifamousfreight/dhi-github-mcp:latest}"
EXPECTED_DIGEST="${2:-sha256:50b2c4f88e0dda38d3a163ad8ef1460fde82a70e2b28da73e6035f93c6f545d9}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to verify image digest." >&2
  exit 1
fi

echo "==> Pulling image: ${IMAGE}"
docker pull "${IMAGE}" >/dev/null

actual_digest="$(
  docker image inspect "${IMAGE}" --format '{{range .RepoDigests}}{{println .}}{{end}}' \
    | awk -F'@' 'NF==2 {print $2; exit}'
)"

if [ -z "${actual_digest}" ]; then
  echo "Unable to determine image digest for ${IMAGE}" >&2
  exit 1
fi

echo "Expected: ${EXPECTED_DIGEST}"
echo "Actual:   ${actual_digest}"

if [ "${actual_digest}" != "${EXPECTED_DIGEST}" ]; then
  echo "Digest mismatch." >&2
  exit 1
fi

echo "Digest verified."
