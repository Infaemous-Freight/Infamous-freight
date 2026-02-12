#!/bin/bash
#
# Production Deployment Verification & Checklist
# Verify all optimizations and monitoring are properly configured
#

set -e

echo "🔍 Production Deployment Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

# Check function
check() {
  local name=$1
  local command=$2
  
  echo -n "Checking $name... "
  if eval "$command" &>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}✗${NC}"
    ((CHECKS_FAILED++))
  fi
}

echo -e "${BLUE}1. Dependency Checks${NC}"
echo "--------------------"
check "compression middleware" "grep -q 'compression' /workspaces/Infamous-freight-enterprises/apps/api/package.json"
check "web-vitals tracking" "grep -q 'web-vitals' /workspaces/Infamous-freight-enterprises/apps/web/package.json"
check "API performance middleware" "test -f /workspaces/Infamous-freight-enterprises/apps/api/src/middleware/performance.js"
check "Database optimization utils" "test -f /workspaces/Infamous-freight-enterprises/apps/api/src/utils/dbOptimization.js"
echo ""

echo -e "${BLUE}2. Web Vitals Monitoring${NC}"
echo "------------------------"
check "Web vitals monitoring module" "test -f /workspaces/Infamous-freight-enterprises/apps/web/lib/webVitalsMonitoring.js"
check "Web vitals config" "test -f /workspaces/Infamous-freight-enterprises/apps/web/lib/webVitalsConfig.js"
check "_app.tsx updated" "grep -q 'reportWebVitals' /workspaces/Infamous-freight-enterprises/apps/web/pages/_app.tsx"
check "next.config.mjs enhanced" "grep -q 'images' /workspaces/Infamous-freight-enterprises/apps/web/next.config.mjs"
echo ""

echo -e "${BLUE}3. Production Monitoring${NC}"
echo "------------------------"
check "Setup monitoring script" "test -f /workspaces/Infamous-freight-enterprises/scripts/setup-monitoring.sh"
check "Database indexes script" "test -f /workspaces/Infamous-freight-enterprises/scripts/db-indexes.sql"
check "Monitoring config module" "test -f /workspaces/Infamous-freight-enterprises/apps/api/src/config/monitoring.js"
check "Environment template updated" "grep -q 'PERFORMANCE_MONITORING_ENABLED' /workspaces/Infamous-freight-enterprises/.env.example"
echo ""

echo -e "${BLUE}4. API Server Integration${NC}"
echo "-------------------------"
check "Compression in server" "grep -q 'compressionMiddleware' /workspaces/Infamous-freight-enterprises/apps/api/src/server.js"
check "Datadog APM import" "grep -q 'dd-trace' /workspaces/Infamous-freight-enterprises/apps/api/src/server.js"
check "Sentry configured" "grep -q 'sentry' /workspaces/Infamous-freight-enterprises/apps/api/src/server.js"
echo ""

echo -e "${BLUE}5. Documentation${NC}"
echo "-----------------"
check "Implementation guide" "test -f /workspaces/Infamous-freight-enterprises/PERFORMANCE_MONITORING_COMPLETE.md"
check "Quick start commands" "grep -q 'pnpm install' /workspaces/Infamous-freight-enterprises/PERFORMANCE_MONITORING_COMPLETE.md"
echo ""

echo "======================================"
echo -e "Results: ${GREEN}$CHECKS_PASSED passed${NC}, ${RED}$CHECKS_FAILED failed${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Ready for production.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. pnpm install                          # Install dependencies"
  echo "2. bash scripts/setup-monitoring.sh      # Configure monitoring"
  echo "3. psql \$DATABASE_URL < scripts/db-indexes.sql  # Create indexes"
  echo "4. DD_TRACE_ENABLED=true pnpm api:dev   # Start API with APM"
  echo ""
  echo "Monitoring dashboards:"
  echo "  - Datadog: https://app.datadoghq.com"
  echo "  - Sentry: https://sentry.io"
  echo "  - Vercel: https://vercel.com/analytics"
else
  echo -e "${RED}❌ Some checks failed. Review above.${NC}"
  exit 1
fi
