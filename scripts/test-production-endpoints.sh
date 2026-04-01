#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${ENDPOINT_BASE_URL:-http://localhost:4000}"
AUTH_TOKEN="${ENDPOINT_AUTH_TOKEN:-}"
TIMEOUT_SECONDS="${ENDPOINT_TIMEOUT_SECONDS:-15}"

if [[ -z "$AUTH_TOKEN" ]]; then
  echo "ENDPOINT_AUTH_TOKEN is required for protected endpoint checks." >&2
  echo "Export a bearer token and retry:" >&2
  echo "  ENDPOINT_AUTH_TOKEN=<token> ENDPOINT_BASE_URL=https://api.example.com $0" >&2
  exit 1
fi

declare -a BILLING_ENDPOINTS=(
  "/api/billing/subscription"
  "/api/billing/usage"
  "/api/billing/portal"
  "/api/billing/invoices"
  "/api/billing/events"
  "/api/billing/plans"
  "/api/billing/checkout"
)

declare -a AI_ENDPOINTS=(
  "/api/ai/dispatch"
  "/api/ai/dispatch/auto"
  "/api/ai/dispatch/review"
  "/api/ai/risk/carrier"
  "/api/ai/risk/driver"
  "/api/ai/risk/shipment"
  "/api/ai/alerts"
  "/api/ai/alerts/critical"
  "/api/ai/decisions"
)

declare -a ACQUISITION_ENDPOINTS=(
  "/api/acquisition/leads"
  "/api/acquisition/leads/high-potential"
  "/api/acquisition/trials"
  "/api/acquisition/funnel"
  "/api/acquisition/conversions"
  "/api/acquisition/campaigns"
  "/api/acquisition/prospects"
  "/api/acquisition/signups"
)

check_endpoint() {
  local group="$1"
  local path="$2"
  local url="${BASE_URL%/}${path}"

  local http_code
  http_code="$(curl --silent --show-error --output /dev/null \
    --write-out '%{http_code}' \
    --max-time "$TIMEOUT_SECONDS" \
    --header "Authorization: Bearer ${AUTH_TOKEN}" \
    "$url")"

  if [[ "$http_code" =~ ^2[0-9][0-9]$ || "$http_code" == "401" || "$http_code" == "403" || "$http_code" == "405" ]]; then
    printf '✅ [%-11s] %3s %s\n' "$group" "$http_code" "$path"
    return 0
  fi

  printf '❌ [%-11s] %3s %s\n' "$group" "$http_code" "$path"
  return 1
}

run_group() {
  local group="$1"
  shift
  local -a endpoints=("$@")
  local failures=0

  for endpoint in "${endpoints[@]}"; do
    check_endpoint "$group" "$endpoint" || failures=$((failures + 1))
  done

  return "$failures"
}

failures=0

echo "Running endpoint checks against ${BASE_URL%/}"
echo

run_group "billing" "${BILLING_ENDPOINTS[@]}" || failures=$((failures + $?))
run_group "ai" "${AI_ENDPOINTS[@]}" || failures=$((failures + $?))
run_group "acquisition" "${ACQUISITION_ENDPOINTS[@]}" || failures=$((failures + $?))

echo
if [[ "$failures" -eq 0 ]]; then
  echo "All 24 production endpoints responded with an accepted status code."
  exit 0
fi

echo "Endpoint verification failed: ${failures} endpoint(s) returned an unexpected status."
exit 1
