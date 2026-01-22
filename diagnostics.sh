#!/bin/bash
# System Diagnostics & Status Check
# Run this to verify current state before proceeding

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  🔍 Infamous Freight Enterprises - System Status Check"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 available"
        return 0
    else
        echo -e "${RED}✗${NC} $1 not available"
        return 1
    fi
}

echo -e "${BLUE}1. Package Manager Check${NC}"
echo "──────────────────────────────────────────────────────────────"
check_command "node" || echo "  Hint: Node.js required for testing"
check_command "npm" || echo "  Hint: npm required for local tests"
check_command "pnpm" || echo "  Hint: pnpm required for monorepo"
check_command "git" || echo "  Hint: git required for version control"
echo ""

echo -e "${BLUE}2. API Deployment Check${NC}"
echo "──────────────────────────────────────────────────────────────"
if command -v curl &> /dev/null; then
    echo "Testing: https://infamous-freight-api.fly.dev/api/health"
    if curl -s https://infamous-freight-api.fly.dev/api/health | grep -q "ok"; then
        echo -e "${GREEN}✓${NC} API is responding"
        DATABASE_STATUS=$(curl -s https://infamous-freight-api.fly.dev/api/health | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
        if [ "$DATABASE_STATUS" = "connected" ]; then
            echo -e "${GREEN}✓${NC} Database is connected"
        else
            echo -e "${YELLOW}⚠${NC}  Database is not connected (expected if secrets not set)"
            echo "    Next step: Set DATABASE_URL in Fly.io"
        fi
    else
        echo -e "${RED}✗${NC} API is not responding"
        echo "    Hint: Check Fly.io logs: flyctl logs -a infamous-freight-api"
    fi
else
    echo -e "${RED}✗${NC} curl not available (needed for health check)"
fi
echo ""

echo -e "${BLUE}3. Git Repository Check${NC}"
echo "──────────────────────────────────────────────────────────────"
if [ -d .git ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    COMMITS=$(git rev-list --count HEAD)
    MODIFIED=$(git status --short | wc -l)
    
    echo "Branch: $BRANCH"
    echo "Total commits: $COMMITS"
    echo "Modified files: $MODIFIED"
    
    if [ "$MODIFIED" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Working directory clean"
    else
        echo -e "${YELLOW}⚠${NC}  $MODIFIED files with uncommitted changes"
    fi
else
    echo -e "${RED}✗${NC} Not a git repository"
fi
echo ""

echo -e "${BLUE}4. Documentation Check${NC}"
echo "──────────────────────────────────────────────────────────────"
DOCS=(
    "API_REFERENCE.md"
    "DEPLOYMENT_RUNBOOK.md"
    "API_TESTING_GUIDE.md"
    "SESSION_2_FINAL_STATUS.md"
    "NEXT_ITERATION_CHECKLIST.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        LINES=$(wc -l < "$doc")
        echo -e "${GREEN}✓${NC} $doc ($LINES lines)"
    else
        echo -e "${RED}✗${NC} $doc missing"
    fi
done
echo ""

echo -e "${BLUE}5. Code Quality Check${NC}"
echo "──────────────────────────────────────────────────────────────"
if command -v npm &> /dev/null; then
    echo "ESLint status: (requires 'npm run lint')"
    echo "Test coverage: (requires 'npm run test:coverage')"
else
    echo -e "${YELLOW}⚠${NC}  npm not available for code quality checks"
fi
echo ""

echo -e "${BLUE}6. Secrets Configuration Check${NC}"
echo "──────────────────────────────────────────────────────────────"
if command -v flyctl &> /dev/null; then
    SECRETS=$(flyctl secrets list -a infamous-freight-api 2>/dev/null | tail -n +2 | wc -l)
    echo "Secrets in Fly.io: $SECRETS"
    
    if flyctl secrets list -a infamous-freight-api 2>/dev/null | grep -q "DATABASE_URL"; then
        echo -e "${GREEN}✓${NC} DATABASE_URL is set"
    else
        echo -e "${RED}✗${NC} DATABASE_URL is NOT set"
        echo "    Next step: flyctl secrets set DATABASE_URL='postgresql://...'"
    fi
    
    if flyctl secrets list -a infamous-freight-api 2>/dev/null | grep -q "JWT_SECRET"; then
        echo -e "${GREEN}✓${NC} JWT_SECRET is set"
    else
        echo -e "${RED}✗${NC} JWT_SECRET is NOT set"
        echo "    Next step: flyctl secrets set JWT_SECRET='<random-secret>'"
    fi
else
    echo -e "${YELLOW}⚠${NC}  flyctl not available"
    echo "    Install: https://fly.io/docs/getting-started/installing-flyctl/"
fi
echo ""

echo -e "${BLUE}7. Recommendations Status${NC}"
echo "──────────────────────────────────────────────────────────────"
echo "Completed (8/10):"
echo "  ✓ Search endpoint implemented"
echo "  ✓ API documentation created"
echo "  ✓ Deployment runbook created"
echo "  ✓ Testing guide created"
echo "  ✓ README updated with live API"
echo "  ✓ API deployed to Fly.io"
echo "  ✓ Code integrated and committed"
echo "  ✓ Documentation indexed"
echo ""
echo "In Progress (2/10):"
echo "  ⏳ Fly.io secrets configuration (blocking)"
echo "  ⏳ Edge case tests execution (blocking npm)"
echo ""
echo "Pending (0/10):"
echo "  ⏳ E2E tests execution"
echo "  ⏳ GitHub Actions CI verification"
echo "  ⏳ Web frontend deployment"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "  🎯 Recommended Next Steps"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "1. CRITICAL (Do first):"
echo "   → Generate JWT secret:  openssl rand -base64 32"
echo "   → Provide DATABASE_URL"
echo "   → Run: flyctl secrets set JWT_SECRET=... DATABASE_URL=..."
echo ""
echo "2. IMMEDIATE (After secrets):"
echo "   → Verify health: curl https://infamous-freight-api.fly.dev/api/health"
echo "   → Should show: \"database\": \"connected\""
echo ""
echo "3. TESTING (If npm available locally):"
echo "   → Run: npm test -- validation-edge-cases.test.js"
echo "   → Run: pnpm e2e --baseURL=https://infamous-freight-api.fly.dev"
echo ""
echo "4. VERIFICATION:"
echo "   → Check GitHub Actions: https://github.com/MrMiless44/Infamous-freight-enterprises/actions"
echo "   → All workflows should be green ✓"
echo ""
echo "5. DEPLOYMENT:"
echo "   → Deploy web to Vercel with API_BASE_URL set"
echo "   → Test full integration"
echo ""
echo "════════════════════════════════════════════════════════════════"
