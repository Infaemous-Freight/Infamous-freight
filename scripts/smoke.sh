#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${SMOKE_BASE_URL:-http://localhost:4000}"
HEALTH_PATH="${SMOKE_HEALTH_PATH:-/api/health}"
URL="${BASE_URL%/}${HEALTH_PATH}"
MAX_ATTEMPTS="${SMOKE_MAX_ATTEMPTS:-20}"
SLEEP_SECONDS="${SMOKE_SLEEP_SECONDS:-2}"

command -v curl >/dev/null 2>&1 || {
  echo "curl is required for smoke checks"
  exit 1
}

echo "==> Running smoke test against ${URL}"

attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  http_code="$(curl -sS -o /tmp/infamous-smoke-response.json -w '%{http_code}' "$URL" || true)"

  if [ "$http_code" = "200" ]; then
    echo "Smoke check passed (HTTP 200)."
    echo "Response:"
    cat /tmp/infamous-smoke-response.json
    echo
    exit 0
  fi

  echo "Attempt ${attempt}/${MAX_ATTEMPTS} failed (HTTP ${http_code:-n/a}); retrying in ${SLEEP_SECONDS}s..."
  sleep "$SLEEP_SECONDS"
  attempt=$((attempt + 1))
done

echo "Smoke check failed after ${MAX_ATTEMPTS} attempts."
exit 1
