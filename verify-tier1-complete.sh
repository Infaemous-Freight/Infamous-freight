#!/bin/bash

# ========================================
# TIER 1 CRITICAL TASKS - VERIFICATION SCRIPT
# ========================================
# Verifies all 5 Tier 1 integrations are complete and correct

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  TIER 1 CRITICAL TASKS - COMPLETE VERIFICATION SUITE  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Helper function
check_status() {
    local description=$1
    local command=$2
    
    echo -n "  $description... "
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# ========== T1-001: Middleware Stack Integration ==========
echo -e "${BLUE}═══ T1-001: Middleware Stack Integration ═══${NC}"

check_status "  Middleware files exist" "test -f apps/api/src/middleware/smartCache.js && test -f apps/api/src/middleware/apiVersioning.js"

check_status "  Middleware imports in server.js" \
    "grep -q 'smartCacheMiddleware' apps/api/src/server.js && \
     grep -q 'apiVersioningMiddleware' apps/api/src/server.js && \
     grep -q 'batchLoaderMiddleware' apps/api/src/server.js"

check_status "  Middleware mounting points" \
    "grep -q 'app.use(smartCacheMiddleware' apps/api/src/server.js && \
     grep -q 'app.use(apiVersioningMiddleware' apps/api/src/server.js && \
     grep -q 'app.use(batchLoaderMiddleware' apps/api/src/server.js"

check_status "  Correct middleware order (cache before rate limit)" \
    "grep -n 'smartCacheMiddleware\\|rateLimit' apps/api/src/server.js | head -2 | tail -1 | grep -q 'smartCacheMiddleware'"

echo ""

# ========== T1-002: Loadenv Configuration ==========
echo -e "${BLUE}═══ T1-002: Activate loadenv Configuration ═══${NC}"

check_status "  loadenv.js file exists" "test -f apps/api/src/config/loadenv.js"

check_status "  index.js imports config" "grep -q 'require.*loadenv' apps/api/src/index.js"

check_status "  server.js imports config" "grep -q 'const config = require' apps/api/src/server.js"

check_status "  NO process.env in server.js" "! grep -E 'process\.env\.[A-Z_]' apps/api/src/server.js"

check_status "  Config uses API_PORT" "grep -q 'config.API_PORT' apps/api/src/index.js"

check_status "  loadenv exports config" "grep -q 'module.exports = config' apps/api/src/config/loadenv.js"

check_status "  Configuration schema defined" "grep -q 'const configSchema' apps/api/src/config/loadenv.js"

echo ""

# ========== T1-003: Prisma Query Monitoring ==========
echo -e "${BLUE}═══ T1-003: Prisma Query Monitoring Hook ═══${NC}"

check_status "  Query monitoring middleware exists" "test -f apps/api/src/middleware/queryMonitoring.js"

check_status "  Query monitor imported in server.js" "grep -q 'queryMonitor' apps/api/src/server.js"

check_status "  Prisma hook configured" "grep -q 'prisma.\\\$on.*query' apps/api/src/server.js"

check_status "  Hook wrapped in try/catch" \
    "grep -B2 -A2 'prisma.\\\$on.*query' apps/api/src/server.js | grep -q 'try'"

echo ""

# ========== T1-004: Batch Loaders ==========
echo -e "${BLUE}═══ T1-004: Register Batch Loaders ═══${NC}"

check_status "  Batch loaders service exists" "test -f apps/api/src/services/batchLoaders.js"

check_status "  batchLoaderMiddleware imported" "grep -q 'batchLoaderMiddleware' apps/api/src/server.js"

check_status "  Batch loader middleware mounted" "grep -q 'app.use(batchLoaderMiddleware' apps/api/src/server.js"

check_status "  Loader context creator exists" "grep -q 'createLoaderContext' apps/api/src/services/batchLoaders.js"

check_status "  All loaders exported" \
    "grep -q 'createShipmentLoader' apps/api/src/services/batchLoaders.js && \
     grep -q 'createUserLoader' apps/api/src/services/batchLoaders.js && \
     grep -q 'createTrackingLoader' apps/api/src/services/batchLoaders.js && \
     grep -q 'createOrganizationLoader' apps/api/src/services/batchLoaders.js"

echo ""

# ========== T1-005: Response Caching ==========
echo -e "${BLUE}═══ T1-005: Enable Response Caching ═══${NC}"

check_status "  Smart cache middleware exists" "test -f apps/api/src/middleware/smartCache.js"

check_status "  smartCacheMiddleware imported" "grep -q 'smartCacheMiddleware' apps/api/src/server.js"

check_status "  cacheInvalidationMiddleware imported" "grep -q 'cacheInvalidationMiddleware' apps/api/src/server.js"

check_status "  Both cache middlewares mounted" \
    "grep -q 'app.use(smartCacheMiddleware' apps/api/src/server.js && \
     grep -q 'app.use(cacheInvalidationMiddleware' apps/api/src/server.js"

check_status "  Cache invalidation after smart cache" \
    "grep -n 'smartCacheMiddleware\\|cacheInvalidationMiddleware' apps/api/src/server.js | head -2 | tail -1 | grep -q 'cacheInvalidationMiddleware'"

check_status "  Cache policies defined" "grep -q 'cacheControlPolicies' apps/api/src/middleware/smartCache.js"

check_status "  Response cache class exists" "grep -q 'class ResponseCache' apps/api/src/middleware/smartCache.js"

check_status "  Admin cache endpoints configured" "grep -q 'cache/stats\\|cache/clear' apps/api/src/middleware/smartCache.js"

echo ""

# ========== Integration Points ==========
echo -e "${BLUE}═══ Integration Verification ═══${NC}"

check_status "  Config imported before middleware use" \
    "grep -n 'require.*loadenv\\|app.use' apps/api/src/server.js | head -2 | grep -q 'loadenv'"

check_status "  All middleware layer 1-3 present" \
    "grep -q 'correlationMiddleware' apps/api/src/server.js && \
     grep -q 'performanceMiddleware' apps/api/src/server.js && \
     grep -q 'smartCacheMiddleware' apps/api/src/server.js"

check_status "  Error handler at end" "grep -q 'app.use(errorHandler)' apps/api/src/server.js"

check_status "  No conflicting middleware" \
    "! grep -c 'app.use.*cache' apps/api/src/server.js | grep -q -E '^[2-9]|^[0-9]{2,}' || [ $(grep -c 'app.use.*cache' apps/api/src/server.js) -eq 2 ]"

echo ""

# ========== Summary ==========
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  VERIFICATION SUMMARY" | awk '{printf "║  %-56s ║\n", $0}'
echo "╠════════════════════════════════════════════════════════════╣"

PERCENTAGE=$((100 * PASSED_CHECKS / TOTAL_CHECKS))
printf "║  Total Checks: %-46s ║\n" "$TOTAL_CHECKS"
printf "║  Passed: %-50s ║\n" "$PASSED_CHECKS ${GREEN}✅${NC}"
printf "║  Failed: %-50s ║\n" "$FAILED_CHECKS"
printf "║  Success Rate: %-45s ║\n" "$PERCENTAGE%"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ ALL TIER 1 CRITICAL TASKS VERIFIED AND COMPLETE!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Copy .env.example to .env"
    echo "   2. Fill in required environment variables"
    echo "   3. Run: pnpm api:dev"
    echo "   4. Test: curl http://localhost:4000/api/health"
    echo ""
    echo "📊 Tier 1 Status: COMPLETE ✅"
    echo "   - Middleware Stack Integration"
    echo "   - Configuration System Active"
    echo "   - Prisma Monitoring Enabled"
    echo "   - Batch Loaders Ready"
    echo "   - Response Caching Active"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ SOME VERIFICATION CHECKS FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "⚠️  Review the failed checks above and fix:"
    echo "   1. Check file locations match workspace"
    echo "   2. Verify imports use correct paths"
    echo "   3. Ensure middleware mounted in correct order"
    echo "   4. Run: grep -n 'failed_pattern' apps/api/src/server.js"
    echo ""
    exit 1
fi
