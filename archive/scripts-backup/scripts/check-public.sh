#!/usr/bin/env bash
set -euo pipefail

WEB_URL=${WEB_URL:-https://infamous-freight-enterprises.vercel.app}
API_URL=${API_URL:-https://infamous-freight-api.fly.dev}

function check() {
  local name=$1
  local url=$2
  echo "Checking $name: $url"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  echo "$name code=$code"
}

check "Web" "$WEB_URL/"
check "API /api/health" "$API_URL/api/health"
check "API /health" "$API_URL/health"

echo "Done."