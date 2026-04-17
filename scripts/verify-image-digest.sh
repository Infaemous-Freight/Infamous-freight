#!/usr/bin/env bash
set -Eeuo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <image[:tag]|image@sha256:digest> <expected-sha256-digest>" >&2
  exit 1
fi

IMAGE="$1"
EXPECTED_DIGEST="$2"
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
