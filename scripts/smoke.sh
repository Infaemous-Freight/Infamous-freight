#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${SMOKE_BASE_URL:-http://localhost:4000}"
HEALTH_PATH="${SMOKE_HEALTH_PATH:-/health}"
MAX_ATTEMPTS="${SMOKE_MAX_ATTEMPTS:-10}"
SLEEP_SECONDS="${SMOKE_SLEEP_SECONDS:-3}"

url="${BASE_URL%/}${HEALTH_PATH}"

echo "Smoke check: $url"

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  if response="$(curl -fsS "$url" 2>/dev/null)"; then
    echo "$response" | grep -q '"ok"[[:space:]]*:[[:space:]]*true' && {
      echo "Smoke check passed"
      exit 0
    }
    echo "Health endpoint responded, but did not contain ok=true (attempt $attempt/$MAX_ATTEMPTS)"
  else
    echo "Attempt $attempt/$MAX_ATTEMPTS failed"
  fi

  if [[ "$attempt" -lt "$MAX_ATTEMPTS" ]]; then
    sleep "$SLEEP_SECONDS"
  fi
done

echo "Smoke check failed after $MAX_ATTEMPTS attempts"
exit 1
