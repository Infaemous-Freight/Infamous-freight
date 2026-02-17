#!/usr/bin/env bash
# Verify critical services (web, API, optional mobile)

set -euo pipefail

WEB_URL="${WEB_URL:-https://infamous-freight-enterprises.vercel.app}"
API_URL="${API_URL:-https://infamous-freight-api.fly.dev}"
EXPO_URL="${EXPO_URL:-}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARN=0

check_http() {
  local name="$1"
  local url="$2"
  local expected="$3"

  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

  if echo "$expected" | grep -q "$code"; then
    echo -e "${GREEN}OK${NC}  $name ($code)"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${RED}FAIL${NC} $name ($code)"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
}

check_http_warn() {
  local name="$1"
  local url="$2"
  local expected="$3"

  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

  if echo "$expected" | grep -q "$code"; then
    echo -e "${GREEN}OK${NC}  $name ($code)"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${YELLOW}WARN${NC} $name ($code)"
    CHECKS_WARN=$((CHECKS_WARN + 1))
  fi
}

check_http "Web" "${WEB_URL}/" "200|301|302|304"
check_http "API health" "${API_URL}/api/health" "200"

check_http_warn "API readiness" "${API_URL}/api/health/ready" "200|404"
check_http_warn "API liveness" "${API_URL}/api/health/live" "200|404"
check_http_warn "API metrics" "${API_URL}/api/metrics" "200|404"
check_http_warn "AI health" "${API_URL}/api/ai/health" "200|404"

if [ -n "$EXPO_URL" ]; then
  check_http_warn "Expo project" "$EXPO_URL" "200|301|302"
else
  echo -e "${YELLOW}WARN${NC} EXPO_URL not set, skipping mobile check"
  CHECKS_WARN=$((CHECKS_WARN + 1))
fi

echo ""
echo "Summary:"
echo "  Passed: $CHECKS_PASSED"
echo "  Warnings: $CHECKS_WARN"
echo "  Failed: $CHECKS_FAILED"

if [ $CHECKS_FAILED -gt 0 ]; then
  exit 1
fi

exit 0
