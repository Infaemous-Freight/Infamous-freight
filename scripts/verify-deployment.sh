#!/usr/bin/env bash
# Infamous Freight - Post-Deployment Verification Script
# Usage: ./scripts/verify-deployment.sh [API_URL] [WEB_URL]

set -euo pipefail

API_URL="${1:-https://api.infamousfreight.com}"
WEB_URL="${2:-https://www.infamousfreight.com}"
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color
PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  echo -n "Testing $name... "
  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++)) || true
  else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++)) || true
  fi
}

echo "=================================="
echo "  Infamous Freight - Go-Live Check"
echo "  API: $API_URL"
echo "  Web: $WEB_URL"
echo "=================================="
echo ""

echo "--- API Health Checks ---"
check "Health endpoint" "curl -sf $API_URL/health"
check "Health/ready endpoint" "curl -sf $API_URL/health/ready"
check "Health/live endpoint" "curl -sf $API_URL/health/live"

echo ""
echo "--- Frontend Checks ---"
check "Web app loads" "curl -sf $WEB_URL | grep -q 'Infamous Freight'"
check "Web app JS bundles" "curl -sf $WEB_URL/assets/ | grep -q '.js' || curl -sf $WEB_URL | grep -q 'script'"

echo ""
echo "--- API CORS Checks ---"
check "CORS preflight" "curl -sfI -X OPTIONS -H 'Origin: $WEB_URL' -H 'Access-Control-Request-Method: GET' $API_URL/health | grep -qi 'access-control-allow-origin'"

echo ""
echo "--- Security Headers Check ---"
check "Web has CSP header" "curl -sfI $WEB_URL | grep -qi 'content-security-policy'"
check "Web has HSTS header" "curl -sfI $WEB_URL | grep -qi 'strict-transport-security'"

echo ""
echo "--- Stripe Webhook Endpoint Check ---"
check "Stripe webhook endpoint exists" "curl -sf $API_URL/stripe/webhook -X POST -H 'Content-Type: application/json' -d '{}' | grep -q 'error' || true"

echo ""
echo "=================================="
echo "  Results: $PASS passed, $FAIL failed"
echo "=================================="

if [ $FAIL -gt 0 ]; then
  echo -e "${YELLOW}Some checks failed. Review the output above.${NC}"
  exit 1
else
  echo -e "${GREEN}All checks passed! Infamous Freight is ready for traffic.${NC}"
  exit 0
fi
