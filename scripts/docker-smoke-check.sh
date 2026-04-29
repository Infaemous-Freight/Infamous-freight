#!/usr/bin/env bash
set -euo pipefail
STRICT_MODE="${DOCKER_SMOKE_STRICT:-false}"

bash scripts/start-docker-daemon.sh || true

if [[ -S /tmp/docker-restricted.sock ]]; then
  export DOCKER_HOST="unix:///tmp/docker-restricted.sock"
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is unavailable; skipping docker smoke check in this environment."
  if [[ "${STRICT_MODE}" == "true" ]]; then
    exit 1
  fi
  exit 0
fi

IMAGE_TAG="infamous-freight-api-smoke:local"
BUILD_LOG="/tmp/docker-build-smoke.log"

set +e
docker build -t "${IMAGE_TAG}" -f Dockerfile . >"${BUILD_LOG}" 2>&1
build_rc=$?
set -e

if [[ $build_rc -ne 0 ]]; then
  if { command -v rg >/dev/null 2>&1 && rg -n "unshare: operation not permitted|operation not permitted" "${BUILD_LOG}" >/dev/null 2>&1; } || \
     { ! command -v rg >/dev/null 2>&1 && grep -E "unshare: operation not permitted|operation not permitted" "${BUILD_LOG}" >/dev/null 2>&1; }; then
    echo "Docker build blocked by container runtime permissions; skipping smoke check."
    if [[ "${STRICT_MODE}" == "true" ]]; then
      cat "${BUILD_LOG}" >&2
      exit 1
    fi
    exit 0
  fi
  cat "${BUILD_LOG}" >&2
  exit $build_rc
fi

CID="$(docker run -d -e PORT=3000 -p 3000:3000 "${IMAGE_TAG}")"
trap 'docker rm -f "${CID}" >/dev/null 2>&1 || true' EXIT

for _ in {1..20}; do
  if curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null 2>&1; then
    echo "Docker smoke check passed."
    exit 0
  fi
  sleep 1
done

echo "Container started but health endpoint did not return 200 in time." >&2
exit 1
