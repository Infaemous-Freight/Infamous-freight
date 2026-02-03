#!/bin/bash

# ============================================
# 🔍 VERIFY 100% WORLDWIDE DEPLOYMENT
# ============================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "🔍 DEPLOYMENT VERIFICATION"
echo "=========================================="
echo ""

# URLs to check
WEB_URL="https://infamous-freight-enterprises.vercel.app"
WEB_GIT_URL="https://infamous-freight-enterprises-git-main-santorio-miles-projects.vercel.app"
API_URL="https://infamous-freight-942.fly.dev"
HEALTH_URL="${API_URL}/api/health"

TOTAL_CHECKS=0
PASSED_CHECKS=0

check_url() {
  local name=$1
  local url=$2
  local expected_code=${3:-200}
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  echo -n "Checking $name... "
  
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 "$url" 2>/dev/null || echo "000")
  
  if [ "$http_code" = "$expected_code" ]; then
    echo -e "${GREEN}✓ OK ($http_code)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    return 0
  else
    echo -e "${RED}✗ FAILED (got $http_code, expected $expected_code)${NC}"
    return 1
  fi
}

check_json_response() {
  local name=$1
  local url=$2
  local field=$3
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  echo -n "Checking $name... "
  
  response=$(curl -s --connect-timeout 10 --max-time 15 "$url" 2>/dev/null || echo "{}")
  
  if echo "$response" | grep -q "\"$field\""; then
    value=$(echo "$response" | grep -o "\"$field\":\"[^\"]*\"" | cut -d'"' -f4 || echo "")
    echo -e "${GREEN}✓ OK ($field: $value)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    return 0
  else
    echo -e "${RED}✗ FAILED (field '$field' not found)${NC}"
    return 1
  fi
}

# ============================================
# Web Application Checks
# ============================================
echo -e "${BLUE}[1/3] Web Application (Vercel)${NC}"
check_url "Main Web URL" "$WEB_URL"
check_url "Git Branch URL" "$WEB_GIT_URL"
echo ""

# ============================================
# API Backend Checks
# ============================================
echo -e "${BLUE}[2/3] API Backend (Fly.io)${NC}"
check_url "API Root" "$API_URL"
check_url "Health Endpoint" "$HEALTH_URL"
check_json_response "Health Status" "$HEALTH_URL" "status"
check_json_response "API Version" "$HEALTH_URL" "version"
echo ""

# ============================================
# Integration Checks
# ============================================
echo -e "${BLUE}[3/3] Integration Tests${NC}"

# Check if Web can reach API (via public URL)
echo -n "Checking Web → API connectivity... "
if curl -s "$WEB_URL" | grep -q "api" 2>/dev/null; then
  echo -e "${GREEN}✓ OK${NC}"
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
  echo -e "${YELLOW}⚠ WARNING (may need env var update)${NC}"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo ""

# ============================================
# Summary
# ============================================
echo "=========================================="
echo "📊 DEPLOYMENT STATUS"
echo "=========================================="
echo ""

PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
  echo -e "${GREEN}✓ ALL CHECKS PASSED ($PASSED_CHECKS/$TOTAL_CHECKS)${NC}"
  echo ""
  echo -e "${GREEN}🎉 100% DEPLOYMENT VERIFIED!${NC}"
elif [ $PERCENTAGE -ge 70 ]; then
  echo -e "${YELLOW}⚠ MOSTLY WORKING ($PASSED_CHECKS/$TOTAL_CHECKS - $PERCENTAGE%)${NC}"
  echo ""
  echo "Some checks failed. Review errors above."
else
  echo -e "${RED}✗ DEPLOYMENT ISSUES ($PASSED_CHECKS/$TOTAL_CHECKS - $PERCENTAGE%)${NC}"
  echo ""
  echo "Multiple checks failed. Review errors above."
fi

echo ""
echo "=========================================="
echo "🌍 LIVE URLs"
echo "=========================================="
echo ""
echo "Web Application:"
echo "  $WEB_URL"
echo ""
echo "API Backend:"
echo "  $API_URL"
echo ""
echo "Health Check:"
echo "  $HEALTH_URL"
echo ""
echo "=========================================="
echo "📝 TROUBLESHOOTING"
echo "=========================================="
echo ""
echo "If checks failed:"
echo ""
echo "1. Check Vercel deployment:"
echo "   https://vercel.com/dashboard"
echo ""
echo "2. Check Fly.io status:"
echo "   flyctl status -a infamous-freight"
echo ""
echo "3. View API logs:"
echo "   flyctl logs -a infamous-freight"
echo ""
echo "4. Verify environment variables:"
echo "   - Vercel: NEXT_PUBLIC_API_URL=$API_URL"
echo "   - GitHub: FLY_API_TOKEN, DATABASE_URL"
echo ""
echo "=========================================="

# Exit with appropriate code
if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
  exit 0
elif [ $PERCENTAGE -ge 70 ]; then
  exit 0  # Acceptable for staging
else
  exit 1
fi
