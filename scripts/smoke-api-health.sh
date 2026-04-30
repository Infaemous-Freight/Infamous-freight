#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" >/dev/null 2>&1; then
    kill "$API_PID" >/dev/null 2>&1 || true
    wait "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

export PORT="${PORT:-3000}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set; running smoke test in NODE_ENV=test fallback mode." >&2
  export NODE_ENV=test
fi

node apps/api/dist/src/server.js >/tmp/if-api-smoke.log 2>&1 &
API_PID=$!

for _ in {1..20}; do
  if curl -fsS "http://127.0.0.1:${PORT}/health" >/tmp/if-api-health.json 2>/dev/null; then
    cat /tmp/if-api-health.json
    exit 0
  fi
  sleep 0.5
done

echo "API health check failed on PORT=${PORT}. Logs:" >&2
cat /tmp/if-api-smoke.log >&2
exit 1
