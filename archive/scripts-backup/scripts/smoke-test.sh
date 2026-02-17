#!/usr/bin/env bash
set -euo pipefail

API_URL=${API_URL:-http://localhost:4000}
WEB_URL=${WEB_URL:-http://localhost:3000}

echo "Checking API health at: $API_URL/api/health"
api_status=$(curl -sS "$API_URL/api/health" | jq -r '.status' || echo "error")
if [[ "$api_status" != "ok" ]]; then
  echo "API health check failed (status=$api_status)" >&2
  exit 1
fi

echo "API health OK"

echo "Checking Web root at: $WEB_URL/"
web_code=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL/")
if [[ "$web_code" != "200" ]]; then
  echo "Web check failed (code=$web_code)" >&2
  exit 1
fi

echo "Web check OK"

echo "Smoke tests passed."