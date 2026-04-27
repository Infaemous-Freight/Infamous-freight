#!/usr/bin/env bash
set -euo pipefail

CANONICAL_SITE_URL="https://www.infamousfreight.com"
BARE_SITE_URL="https://infamousfreight.com"
FLY_API_URL="https://infamous-freight.fly.dev"

echo "Checking canonical frontend..."
curl --fail --show-error --location --head "${CANONICAL_SITE_URL}"

echo "Checking bare-domain redirect..."
final_url=$(curl --silent --location --head --output /dev/null --write-out '%{url_effective}' "${BARE_SITE_URL}")
if [[ "${final_url}" != "${CANONICAL_SITE_URL}/" ]]; then
  echo "ERROR: Bare domain resolved to ${final_url}, expected ${CANONICAL_SITE_URL}/" >&2
  exit 1
fi

echo "Checking Fly root health..."
curl --fail --show-error --silent "${FLY_API_URL}/health"
echo

echo "Checking Fly API health..."
curl --fail --show-error --silent "${FLY_API_URL}/api/health"
echo

echo "Checking proxied API health..."
curl --fail --show-error --silent "${CANONICAL_SITE_URL}/api/health"
echo

echo "Verifying rate-limit headers are present on a write endpoint..."
rl_limit=$(curl --silent --show-error \
  -D - --output /dev/null \
  -X POST "${FLY_API_URL}/api/billing/checkout-session" \
  -H 'Content-Type: application/json' \
  -d '{}' \
  | grep -i '^x-ratelimit-limit:' | awk -F': ' '{print $2}' | tr -d '[:space:]')
if [[ -z "${rl_limit}" ]]; then
  echo "ERROR: X-RateLimit-Limit header missing on billing write endpoint" >&2
  exit 1
fi
echo "Rate-limit header X-RateLimit-Limit=${rl_limit} confirmed."

echo "Production smoke test passed."
