#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

SMOKE_MAX_ATTEMPTS="${SMOKE_MAX_ATTEMPTS:-5}"
SMOKE_RETRY_DELAY="${SMOKE_RETRY_DELAY:-2}"

curl_with_retry() {
  local url="$1"
  local attempt=1

  while true; do
    if curl -fsS "$url" >/dev/null; then
      return 0
    fi

    if (( attempt >= SMOKE_MAX_ATTEMPTS )); then
      echo "Request to ${url} failed after ${SMOKE_MAX_ATTEMPTS} attempts." >&2
      return 1
    fi

    echo "Request to ${url} failed (attempt ${attempt}/${SMOKE_MAX_ATTEMPTS}), retrying in ${SMOKE_RETRY_DELAY}s..." >&2
    sleep "${SMOKE_RETRY_DELAY}"
    ((attempt++))
  done
}

printf 'Running release smoke checks\n'
printf 'API_URL=%s\n' "$API_URL"
printf 'WEB_URL=%s\n' "$WEB_URL"

curl_with_retry "$API_URL/health"
curl_with_retry "$WEB_URL"

echo "Smoke checks passed."
