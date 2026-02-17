#!/bin/bash
set -e

# Phase Readiness Validation Script
# Validates that all prerequisites and documentation are ready for each phase

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║           v2.0.0 PHASE READINESS VALIDATION                                ║"
echo "║           Date: $(date +%Y-%m-%d)                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((TOTAL_CHECKS++))
    ((PASSED_CHECKS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((TOTAL_CHECKS++))
    ((FAILED_CHECKS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 1: PRODUCTION DEPLOYMENT READINESS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check documentation exists
if [ -f "PHASE_1_PRODUCTION_SERVER_DEPLOYMENT.md" ]; then
    check_pass "Phase 1 documentation exists"
else
    check_fail "Phase 1 documentation missing"
fi

# Check docker-compose file
if [ -f "docker-compose.production.yml" ]; then
    check_pass "Production docker-compose file exists"
else
    check_fail "Production docker-compose file missing"
fi

# Check environment template
if [ -f ".env.production" ]; then
    check_pass "Production environment template exists"
else
    check_fail "Production environment template missing"
fi

# Check Prisma schema
if [ -f "apps/api/prisma/schema.prisma" ]; then
    check_pass "Prisma schema exists"
else
    check_fail "Prisma schema missing"
fi

# Check monitoring configs
if [ -f "monitoring/prometheus.yml" ]; then
    check_pass "Prometheus configuration exists"
else
    check_fail "Prometheus configuration missing"
fi

if [ -f "monitoring/grafana/dashboards/api-dashboard.json" ]; then
    check_pass "Grafana dashboard exists"
else
    check_fail "Grafana dashboard missing"
fi

# Check deployment scripts
if [ -f "scripts/deploy-phase1-setup.sh" ]; then
    check_pass "Phase 1 deployment script exists"
else
    check_warn "Phase 1 deployment script not found (optional)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 2: PERFORMANCE OPTIMIZATION READINESS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "PHASE_2_PERFORMANCE_OPTIMIZATION.md" ]; then
    check_pass "Phase 2 documentation exists"
else
    check_fail "Phase 2 documentation missing"
fi

if [ -f "scripts/deploy-phase2-setup.sh" ]; then
    check_pass "Phase 2 deployment script exists"
else
    check_warn "Phase 2 deployment script not found (optional)"
fi

# Check if optimization SQL exists in docs
if grep -q "CREATE INDEX" PHASE_2_PERFORMANCE_OPTIMIZATION.md 2>/dev/null; then
    check_pass "Database optimization queries documented"
else
    check_warn "Database optimization queries may need documentation"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 3: FEATURE IMPLEMENTATION READINESS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "PHASE_3_4_FEATURES_SCALING.md" ]; then
    check_pass "Phase 3-4 documentation exists"
else
    check_fail "Phase 3-4 documentation missing"
fi

# Check ML service
if [ -f "apps/api/src/services/ml/predictiveAvailability.ts" ]; then
    check_pass "ML Predictive Availability service exists"
else
    check_warn "ML service not found (will be implemented in Phase 3)"
fi

# Check if Socket.IO is configured
if grep -q "socket.io" package.json 2>/dev/null; then
    check_pass "Socket.IO dependency exists"
else
    check_warn "Socket.IO dependency may be needed for GPS tracking"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 4: INFRASTRUCTURE SCALING READINESS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check executive analytics service
if [ -f "apps/api/src/services/analytics/executiveAnalytics.ts" ]; then
    check_pass "Executive Analytics service exists"
else
    check_warn "Executive Analytics service not found (will be implemented in Phase 4)"
fi

if [ -f "scripts/deploy-phase4-setup.sh" ]; then
    check_pass "Phase 4 deployment script exists"
else
    check_warn "Phase 4 deployment script not found (optional)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "REPOSITORY & CODEBASE CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check git status
if [ -d ".git" ]; then
    check_pass "Git repository initialized"
    
    # Check if we're on main branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" = "main" ]; then
        check_pass "On main branch"
    else
        check_warn "Not on main branch (currently on: $CURRENT_BRANCH)"
    fi
    
    # Check if there are uncommitted changes
    if [ -z "$(git status --porcelain)" ]; then
        check_pass "No uncommitted changes"
    else
        check_warn "Uncommitted changes detected"
    fi
else
    check_fail "Git repository not initialized"
fi

# Check package.json
if [ -f "package.json" ]; then
    check_pass "Root package.json exists"
else
    check_fail "Root package.json missing"
fi

# Check API package.json
if [ -f "apps/api/package.json" ]; then
    check_pass "API package.json exists"
else
    check_fail "API package.json missing"
fi

# Check Web package.json
if [ -f "apps/web/package.json" ]; then
    check_pass "Web package.json exists"
else
    check_fail "Web package.json missing"
fi

# Check shared package
if [ -f "packages/shared/package.json" ]; then
    check_pass "Shared package exists"
else
    check_fail "Shared package missing"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SYSTEM PREREQUISITES (Production Server)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed ($NODE_VERSION)"
    
    # Check if version is v18+
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        check_pass "Node.js version is v18+ ✓"
    else
        check_fail "Node.js version must be v18+ (current: $NODE_VERSION)"
    fi
else
    check_warn "Node.js not found (required on production server)"
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    check_pass "pnpm installed ($PNPM_VERSION)"
else
    check_warn "pnpm not found (required on production server)"
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    check_pass "Docker installed ($DOCKER_VERSION)"
else
    check_warn "Docker not found (required on production server)"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    check_pass "Docker Compose available"
else
    check_warn "Docker Compose not found (required on production server)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VALIDATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total Checks:  $TOTAL_CHECKS"
echo -e "${GREEN}Passed:        $PASSED_CHECKS${NC}"
if [ $FAILED_CHECKS -gt 0 ]; then
    echo -e "${RED}Failed:        $FAILED_CHECKS${NC}"
fi
echo ""

# Calculate percentage
if [ $TOTAL_CHECKS -gt 0 ]; then
    PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo "Readiness:     $PERCENTAGE%"
    echo ""
    
    if [ $PERCENTAGE -ge 90 ]; then
        echo -e "${GREEN}✅ READY FOR PRODUCTION DEPLOYMENT${NC}"
        echo ""
        echo "Next Steps:"
        echo "1. Review PHASE_1_PRODUCTION_SERVER_DEPLOYMENT.md"
        echo "2. Provision production server (AWS/DO/Azure/Render)"
        echo "3. Configure .env.production with real secrets"
        echo "4. Execute Phase 1 deployment"
        exit 0
    elif [ $PERCENTAGE -ge 70 ]; then
        echo -e "${YELLOW}⚠ MOSTLY READY - Review warnings above${NC}"
        echo ""
        echo "Address warnings before production deployment"
        exit 1
    else
        echo -e "${RED}❌ NOT READY - Critical issues detected${NC}"
        echo ""
        echo "Fix failed checks before proceeding"
        exit 1
    fi
else
    echo "No checks performed"
    exit 1
fi
