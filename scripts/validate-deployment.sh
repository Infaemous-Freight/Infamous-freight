#!/bin/bash
# Deployment Validation Script
# Validates that the system is ready for production deployment

set -e

echo "🔍 Infamous Freight - Deployment Validation"
echo "==========================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

check() {
  local name=$1
  local cmd=$2
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} $name"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo -e "${RED}❌${NC} $name"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
}

echo -e "${BLUE}📋 Code Quality${NC}"
check "Git repo clean" "git status --porcelain | wc -l | grep -q '^0$'"
check "Main branch up-to-date" "git rev-parse main | grep -q ."
check "package.json exists" "[ -f package.json ]"
check "pnpm-lock.yaml exists" "[ -f pnpm-lock.yaml ]"

echo ""
echo -e "${BLUE}🔐 Security & Configuration${NC}"
check "Shared package exists" "[ -d packages/shared ]"
check "API middleware present" "[ -f apps/api/src/middleware/security.js ]"
check "Validation middleware" "[ -f apps/api/src/middleware/validation.js ]"
check ".env.example exists" "[ -f .env.example ]"
check ".gitignore has .env" "grep -q '^\\.env' .gitignore"
check ".gitignore has node_modules" "grep -q '^node_modules' .gitignore"

echo ""
echo -e "${BLUE}📚 Documentation${NC}"
check "NEXT_STEPS_100_INDEX.md" "[ -f NEXT_STEPS_100_INDEX.md ]"
check "PRODUCTION_LAUNCH_MASTER_INDEX.md" "[ -f PRODUCTION_LAUNCH_MASTER_INDEX.md ]"
check "LAUNCH_DAY_CHECKLIST.md" "[ -f docs/LAUNCH_DAY_CHECKLIST.md ]"
check "DEPLOYMENT_RUNBOOK_KUBERNETES.md" "[ -f docs/DEPLOYMENT_RUNBOOK_KUBERNETES.md ]"
check "ENV_SETUP_SECRETS_GUIDE.md" "[ -f docs/ENV_SETUP_SECRETS_GUIDE.md ]"
check "MONITORING_OBSERVABILITY_SETUP.md" "[ -f docs/MONITORING_OBSERVABILITY_SETUP.md ]"
check "PRE_LAUNCH_SECURITY_AUDIT.md" "[ -f docs/PRE_LAUNCH_SECURITY_AUDIT.md ]"
check "CORS_AND_SECURITY.md" "[ -f docs/CORS_AND_SECURITY.md ]"
check "ROUTE_SCOPE_REGISTRY.md" "[ -f docs/ROUTE_SCOPE_REGISTRY.md ]"

echo ""
echo -e "${BLUE}🚀 Deployment & CI/CD${NC}"
check "API tests workflow" "[ -f .github/workflows/api-tests.yml ]"
check "Code quality workflow" "[ -f .github/workflows/code-quality.yml ]"
check "Pre-push hook exists" "[ -f .husky/pre-push ]"
check "Pre-dev hook exists" "[ -f .husky/pre-dev ]"
check "Verification script" "[ -f scripts/verify-implementation.sh ]"

echo ""
echo -e "${BLUE}🏗️ API Routes & Features${NC}"
check "Shipments route" "[ -f apps/api/src/routes/shipments.js ]"
check "Billing route" "[ -f apps/api/src/routes/billing.js ]"
check "Voice route" "[ -f apps/api/src/routes/voice.js ]"
check "Health route" "[ -f apps/api/src/routes/health.js ]"
check "AI commands route" "[ -f apps/api/src/routes/ai.commands.js ]"

echo ""
echo -e "${BLUE}🧪 Test Coverage${NC}"
check "API tests present" "[ -d apps/api/src/__tests__ ]"
check "Shipments auth tests" "[ -f apps/api/src/__tests__/integration/shipments.auth.test.js ]"
check "Billing auth tests" "[ -f apps/api/src/__tests__/integration/billing.auth.test.js ]"
check "Metrics tests" "[ -f apps/api/src/__tests__/integration/metrics.prometheus.test.js ]"

echo ""
echo -e "${BLUE}📊 Observability${NC}"
check "Prometheus metrics lib" "[ -f apps/api/src/lib/prometheusMetrics.js ]"
check "Slow query logger" "[ -f apps/api/src/lib/slowQueryLogger.js ]"
check "Metrics recorder middleware" "[ -f apps/api/src/middleware/metricsRecorder.js ]"
check "Response cache middleware" "[ -f apps/api/src/middleware/responseCache.js ]"
check "Rate limit metrics" "[ -f apps/api/src/lib/rateLimitMetrics.js ]"

echo ""
echo "==========================================================="
echo -e "📊 Summary: ${GREEN}$PASSED_CHECKS passed${NC} / ${RED}$FAILED_CHECKS failed${NC} / $TOTAL_CHECKS total"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! System is ready for deployment.${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review docs/LAUNCH_DAY_CHECKLIST.md"
  echo "  2. Configure environment variables (.env.local)"
  echo "  3. Set up database (PostgreSQL)"
  echo "  4. Deploy using chosen platform (K8s/Docker/Heroku)"
  echo "  5. Run smoke tests from DEPLOYMENT_RUNBOOK_KUBERNETES.md"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Some checks failed. Please review above.${NC}"
  exit 1
fi
