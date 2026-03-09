#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
HEALTH_URL="${API_URL}/health"

echo "==> Running smoke test against ${HEALTH_URL}"

response="$(curl --silent --show-error --fail "${HEALTH_URL}")"

echo "==> Health response:"
echo "${response}"

echo "${response}" | grep '"ok":true' >/dev/null

echo "Smoke test passed."
