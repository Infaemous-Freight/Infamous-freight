#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/lib/health-endpoints.sh"

WEB_URL="${WEB_URL:-https://www.infamousfreight.com}"
BARE_SITE_URL="${BARE_SITE_URL:-https://infamousfreight.com}"
API_URL="${API_URL:-https://infamous-freight-api.fly.dev}"
WEB_API_HEALTH_URL="${WEB_API_HEALTH_URL:-${WEB_URL%/}/api/health}"
PUBLIC_QUOTE_PREFLIGHT_URL="${PUBLIC_QUOTE_PREFLIGHT_URL:-${WEB_URL%/}/api/public/quote-requests}"
PUBLIC_INVALID_SHIPMENT_URL="${PUBLIC_INVALID_SHIPMENT_URL:-${WEB_URL%/}/api/public/shipments/invalid-tracking}"
PUBLIC_VALID_TRACKING_NUMBER="${PUBLIC_VALID_TRACKING_NUMBER:-}"
PUBLIC_VALID_SHIPMENT_URL="${PUBLIC_VALID_SHIPMENT_URL:-}"

echo "Checking canonical frontend..."
curl --fail --show-error --location --head "${WEB_URL}"

echo "Checking bare-domain redirect..."
final_url=$(curl --silent --location --head --output /dev/null --write-out '%{url_effective}' "${BARE_SITE_URL}")
if [[ "${final_url}" != "${WEB_URL%/}/" ]]; then
  echo "ERROR: Bare domain resolved to ${final_url}, expected ${WEB_URL%/}/" >&2
  exit 1
fi

echo "Checking API liveness..."
curl --fail --show-error --silent "${API_URL%/}${INFAMOUS_HEALTH_LIVE_PATH}"
echo

echo "Checking API readiness..."
curl --fail --show-error --silent "${API_URL%/}${INFAMOUS_HEALTH_READY_PATH}"
echo

echo "Checking proxied web API health..."
api_health_content_type=$(
  curl --fail --show-error --silent --location \
    --output /tmp/infamous-proxied-health.json \
    --write-out '%{content_type}' \
    "${WEB_API_HEALTH_URL}"
)
if [[ "${api_health_content_type}" != application/json* ]]; then
  echo "ERROR: Proxied API health returned ${api_health_content_type:-no content type}, expected JSON." >&2
  exit 1
fi
cat /tmp/infamous-proxied-health.json
echo

echo "Checking public quote preflight..."
quote_preflight_status=$(
  curl --show-error --silent --location \
    --request OPTIONS \
    --output /dev/null \
    --write-out '%{http_code}' \
    "${PUBLIC_QUOTE_PREFLIGHT_URL}"
)
if [[ "${quote_preflight_status}" != "204" ]]; then
  echo "ERROR: Public quote preflight returned HTTP ${quote_preflight_status}, expected 204." >&2
  exit 1
fi

echo "Checking invalid public tracking lookup..."
invalid_tracking_status=$(
  curl --show-error --silent --location \
    --output /tmp/infamous-invalid-tracking.json \
    --write-out '%{http_code}' \
    "${PUBLIC_INVALID_SHIPMENT_URL}"
)
if [[ "${invalid_tracking_status}" != "400" ]]; then
  echo "ERROR: Invalid tracking lookup returned HTTP ${invalid_tracking_status}, expected 400." >&2
  exit 1
fi

if ! grep -q 'invalid_tracking_number' /tmp/infamous-invalid-tracking.json; then
  echo "ERROR: Invalid tracking lookup did not return the expected validation code." >&2
  exit 1
fi

if [[ -n "${PUBLIC_VALID_TRACKING_NUMBER}" || -n "${PUBLIC_VALID_SHIPMENT_URL}" ]]; then
  if [[ -z "${PUBLIC_VALID_SHIPMENT_URL}" ]]; then
    PUBLIC_VALID_SHIPMENT_URL="${WEB_URL%/}/api/public/shipments/${PUBLIC_VALID_TRACKING_NUMBER}"
  fi

  echo "Checking valid public tracking lookup..."
  valid_tracking_status=$(
    curl --show-error --silent --location \
      --output /tmp/infamous-valid-tracking.json \
      --write-out '%{http_code}' \
      "${PUBLIC_VALID_SHIPMENT_URL}"
  )
  if [[ "${valid_tracking_status}" != "200" ]]; then
    echo "ERROR: Valid tracking lookup returned HTTP ${valid_tracking_status}, expected 200." >&2
    cat /tmp/infamous-valid-tracking.json >&2
    exit 1
  fi

  node - /tmp/infamous-valid-tracking.json <<'NODE'
const fs = require('node:fs');
const file = process.argv[2];
const body = JSON.parse(fs.readFileSync(file, 'utf8'));
const shipment = body.shipment;

if (!shipment || typeof shipment !== 'object') {
  throw new Error('Valid tracking response did not include shipment object.');
}

for (const field of ['trackingNumber', 'status', 'origin', 'destination', 'lastUpdated']) {
  if (typeof shipment[field] !== 'string' || shipment[field].trim().length === 0) {
    throw new Error(`Valid tracking shipment.${field} is missing or empty.`);
  }
}

if (body.success !== true) {
  throw new Error('Valid tracking response success flag must be true.');
}
NODE
else
  echo "Skipping valid public tracking lookup; set PUBLIC_VALID_TRACKING_NUMBER or PUBLIC_VALID_SHIPMENT_URL to verify a known-safe shipment."
fi

echo "Production smoke test passed."
