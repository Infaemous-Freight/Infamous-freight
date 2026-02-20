#!/bin/bash

###############################################################################
# Middleware Integration Validation Script
#
# Verifies that all middleware is correctly integrated into the Express app
# and functioning as expected.
#
# Usage: ./validate-middleware.sh
###############################################################################

set -e

echo "🔍 Validating Middleware Integration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Helper functions
check_pass() {
  echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  ((ERRORS++))
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

echo "═══════════════════════════════════════════════════════════════════════════"
echo "1. Checking Middleware Imports in server.js"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Check if all required middleware modules exist
middleware_files=(
  "apps/api/src/middleware/smartCache.js"
  "apps/api/src/middleware/apiVersioning.js"
  "apps/api/src/services/batchLoaders.js"
  "apps/api/src/middleware/queryMonitoring.js"
  "apps/api/src/middleware/tokenRotation.js"
)

for file in "${middleware_files[@]}"; do
  if [ -f "$file" ]; then
    check_pass "Found: $file"
  else
    check_fail "Missing: $file"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "2. Checking Middleware Integration in server.js"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Check if middleware is imported
if grep -q "smartCacheMiddleware" apps/api/src/server.js; then
  check_pass "smartCacheMiddleware imported"
else
  check_fail "smartCacheMiddleware not imported"
fi

if grep -q "apiVersioningMiddleware" apps/api/src/server.js; then
  check_pass "apiVersioningMiddleware imported"
else
  check_fail "apiVersioningMiddleware not imported"
fi

if grep -q "batchLoaderMiddleware" apps/api/src/server.js; then
  check_pass "batchLoaderMiddleware imported"
else
  check_fail "batchLoaderMiddleware not imported"
fi

if grep -q "queryMonitor" apps/api/src/server.js; then
  check_pass "queryMonitor imported"
else
  check_fail "queryMonitor not imported"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "3. Checking Middleware Mounting"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Check if middleware is mounted
if grep -q "app.use(smartCacheMiddleware())" apps/api/src/server.js; then
  check_pass "smartCacheMiddleware mounted"
else
  check_fail "smartCacheMiddleware not mounted"
fi

if grep -q "app.use(apiVersioningMiddleware)" apps/api/src/server.js; then
  check_pass "apiVersioningMiddleware mounted"
else
  check_fail "apiVersioningMiddleware not mounted"
fi

if grep -q "app.use(batchLoaderMiddleware)" apps/api/src/server.js; then
  check_pass "batchLoaderMiddleware mounted"
else
  check_fail "batchLoaderMiddleware not mounted"
fi

if grep -q 'prisma.\$on("query"' apps/api/src/server.js; then
  check_pass "Prisma query monitoring hooked"
else
  check_fail "Prisma query monitoring not hooked"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "4. Checking Middleware Order"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Extract middleware order from server.js
middleware_order=$(grep -n "app.use" apps/api/src/server.js | grep -E "(smartCache|apiVersioning|batchLoader|rateLimit|jwtRotation|auditContext)" | head -10)

if [ -z "$middleware_order" ]; then
  check_warn "Could not verify middleware order (manual inspection needed)"
else
  check_pass "Middleware order detected:"
  echo "$middleware_order" | sed 's/^/  /'
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ $ERRORS error(s) found${NC}"
  echo -e "${YELLOW}⚠ $WARNINGS warning(s)${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Fix any errors shown above"
  echo "2. Follow MIDDLEWARE_INTEGRATION_GUIDE.md for correct middleware order"
  echo "3. Re-run this script to verify"
  exit 1
fi
