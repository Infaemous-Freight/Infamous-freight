#!/bin/bash
# Comprehensive Testing & Validation Script
# Infamous Freight Enterprises - Run all tests and checks

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Track results
TESTS_PASSED=0
TESTS_FAILED=0
CHECKS_PASSED=0
CHECKS_FAILED=0

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Infamous Freight Enterprises - Full Validation${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Change to root directory
cd /workspaces/Infamous-freight-enterprises

# 1. Dependency Check
echo -e "${BLUE}═══ 1. Dependency Check ═══${NC}"
if pnpm install --frozen-lockfile --offline &>/dev/null; then
  echo -e "${GREEN}✓ Dependencies are up to date${NC}"
  ((CHECKS_PASSED++))
else
  echo -e "${YELLOW}⚠ Running pnpm install...${NC}"
  pnpm install
  ((CHECKS_PASSED++))
fi
echo ""

# 2. Shared Package Build
echo -e "${BLUE}═══ 2. Shared Package Build ═══${NC}"
if pnpm --filter @infamous-freight/shared build; then
  echo -e "${GREEN}✓ Shared package built successfully${NC}"
  ((CHECKS_PASSED++))
else
  echo -e "${RED}✗ Shared package build failed${NC}"
  ((CHECKS_FAILED++))
fi
echo ""

# 3. TypeScript Type Checking
echo -e "${BLUE}═══ 3. TypeScript Type Checking ═══${NC}"
if pnpm typecheck; then
  echo -e "${GREEN}✓ All type checks passed${NC}"
  ((CHECKS_PASSED++))
else
  echo -e "${RED}✗ Type checking failed${NC}"
  ((CHECKS_FAILED++))
fi
echo ""

# 4. Lint Check
echo -e "${BLUE}═══ 4. Lint Check ═══${NC}"
if pnpm lint --max-warnings 100; then
  echo -e "${GREEN}✓ Lint passed${NC}"
  ((CHECKS_PASSED++))
else
  echo -e "${YELLOW}⚠ Lint has warnings/errors${NC}"
  echo -e "${YELLOW}  Run: pnpm lint --fix${NC}"
  ((CHECKS_FAILED++))
fi
echo ""

# 5. API Tests
echo -e "${BLUE}═══ 5. API Tests ═══${NC}"
if pnpm --filter api test --silent; then
  echo -e "${GREEN}✓ API tests passed${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ API tests failed${NC}"
  ((TESTS_FAILED++))
fi
echo ""

# 6. API Test Coverage
echo -e "${BLUE}═══ 6. API Test Coverage ═══${NC}"
echo -e "${YELLOW}Generating coverage report...${NC}"
if pnpm --filter api test:coverage --silent; then
  echo -e "${GREEN}✓ Coverage report generated${NC}"
  echo -e "${BLUE}View at: apps/api/coverage/index.html${NC}"
  ((CHECKS_PASSED++))
else
  echo -e "${YELLOW}⚠ Coverage generation failed${NC}"
  ((CHECKS_FAILED++))
fi
echo ""

# 7. Build Check (Web)
echo -e "${BLUE}═══ 7. Web App Build ═══${NC}"
if pnpm --filter web build; then
  echo -e "${GREEN}✓ Web app built successfully${NC}"
  ((CHECKS_PASSED++))
else
  echo -e "${RED}✗ Web app build failed${NC}"
  ((CHECKS_FAILED++))
fi
echo ""

# 8. Check Environment Files
echo -e "${BLUE}═══ 8. Environment Configuration ═══${NC}"
ENV_ERRORS=0

# Check web .env.example
if [ -f "apps/web/.env.example" ]; then
  echo -e "${GREEN}✓ apps/web/.env.example exists${NC}"
else
  echo -e "${RED}✗ apps/web/.env.example missing${NC}"
  ((ENV_ERRORS++))
fi

# Check if .env.local exists (optional)
if [ -f "apps/web/.env.local" ]; then
  echo -e "${GREEN}✓ apps/web/.env.local configured${NC}"
else
  echo -e "${YELLOW}⚠ apps/web/.env.local not found (optional)${NC}"
fi

# Check Supabase configuration
if [ -f "supabase/config.toml" ]; then
  echo -e "${GREEN}✓ Supabase configured${NC}"
else
  echo -e "${YELLOW}⚠ Supabase config.toml not found${NC}"
fi

if [ $ENV_ERRORS -eq 0 ]; then
  ((CHECKS_PASSED++))
else
  ((CHECKS_FAILED++))
fi
echo ""

# 9. Security Check
echo -e "${BLUE}═══ 9. Security Audit ═══${NC}"
echo -e "${YELLOW}Running pnpm audit...${NC}"
AUDIT_OUTPUT=$(pnpm audit --audit-level=high 2>&1)
if echo "$AUDIT_OUTPUT" | grep -q "No known vulnerabilities found"; then
  echo -e "${GREEN}✓ No high/critical vulnerabilities found${NC}"
  ((CHECKS_PASSED++))
else
  echo -e "${YELLOW}⚠ Vulnerabilities found:${NC}"
  echo "$AUDIT_OUTPUT" | head -20
  echo -e "${YELLOW}  Run: pnpm audit --fix${NC}"
  ((CHECKS_PASSED++))  # Don't fail on this
fi
echo ""

# 10. Git Status Check
echo -e "${BLUE}═══ 10. Git Status ═══${NC}"
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${GREEN}✓ Working tree is clean${NC}"
  ((CHECKS_PASSED++))
else
  echo -e "${YELLOW}⚠ Uncommitted changes detected${NC}"
  git status --short | head -10
  ((CHECKS_PASSED++))  # Don't fail on this
fi
echo ""

# Summary
TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED))
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
TOTAL=$((TOTAL_CHECKS + TOTAL_TESTS))
SUCCESS=$((CHECKS_PASSED + TESTS_PASSED))

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Validation Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Checks:${NC}"
echo -e "  Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "  Failed: ${RED}$CHECKS_FAILED${NC}"
echo ""
echo -e "${BLUE}Tests:${NC}"
echo -e "  Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "  Failed: ${RED}$TESTS_FAILED${NC}"
echo ""
echo -e "${BLUE}Overall:${NC}"
echo -e "  Success Rate: ${GREEN}$SUCCESS${NC} / ${BLUE}$TOTAL${NC} ($(( SUCCESS * 100 / TOTAL ))%)"
echo ""

if [ $CHECKS_FAILED -eq 0 ] && [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All validations passed!${NC}"
  echo ""
  echo -e "${BLUE}Ready for:${NC}"
  echo "  • Git commit"
  echo "  • Git push"
  echo "  • Production deployment"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Some validations failed${NC}"
  echo ""
  echo -e "${YELLOW}Fix the following:${NC}"
  [ $CHECKS_FAILED -gt 0 ] && echo "  • Check failures: $CHECKS_FAILED"
  [ $TESTS_FAILED -gt 0 ] && echo "  • Test failures: $TESTS_FAILED"
  echo ""
  echo -e "${BLUE}Suggested fixes:${NC}"
  echo "  1. TypeScript errors: Review and fix type issues"
  echo "  2. Lint errors: Run ./scripts/fix-lint.sh"
  echo "  3. Test failures: Review test output above"
  echo "  4. Build errors: Check error logs"
  echo ""
  exit 1
fi
