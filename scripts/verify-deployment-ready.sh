#!/bin/bash
# Quick deployment verification script
# Tests that the build works before deploying

set -e

echo "🧪 Pre-Deployment Verification for infamousfreight.com"
echo "======================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test 1: Check firebase.json exists
echo -n "1. Checking firebase.json... "
if [ -f "firebase.json" ]; then
    echo -e "${GREEN}✓ Pass${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Fail${NC}"
    ((FAILED++))
fi

# Test 2: Check .firebaserc exists
echo -n "2. Checking .firebaserc... "
if [ -f ".firebaserc" ]; then
    echo -e "${GREEN}✓ Pass${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Fail${NC}"
    ((FAILED++))
fi

# Test 3: Check sitemap.xml exists
echo -n "3. Checking sitemap.xml... "
if [ -f "apps/web/public/sitemap.xml" ]; then
    echo -e "${GREEN}✓ Pass${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Fail${NC} - Run: node scripts/generate-sitemap.js"
    ((FAILED++))
fi

# Test 4: Check robots.txt exists
echo -n "4. Checking robots.txt... "
if [ -f "apps/web/public/robots.txt" ]; then
    echo -e "${GREEN}✓ Pass${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Fail${NC}"
    ((FAILED++))
fi

# Test 5: Check favicon files
echo -n "5. Checking favicon files... "
FAVICON_COUNT=0
[ -f "apps/web/public/favicon.ico" ] && ((FAVICON_COUNT++))
[ -f "apps/web/public/favicon-16x16.png" ] && ((FAVICON_COUNT++))
[ -f "apps/web/public/favicon-32x32.png" ] && ((FAVICON_COUNT++))

if [ $FAVICON_COUNT -ge 2 ]; then
    echo -e "${GREEN}✓ Pass${NC} ($FAVICON_COUNT/3 found)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Warning${NC} ($FAVICON_COUNT/3 found) - Run: ./scripts/generate-favicons.sh"
    ((PASSED++))  # Not critical, so still pass
fi

# Test 6: Check Next.js config for static export
echo -n "6. Checking Next.js export config... "
if grep -q "output:.*'export'" apps/web/next.config.mjs || grep -q 'BUILD_TARGET.*firebase' apps/web/next.config.mjs; then
    echo -e "${GREEN}✓ Pass${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Fail${NC} - Next.js must be configured for static export"
    ((FAILED++))
fi

# Test 7: Try to build (optional, takes time)
if [ "$1" = "--build" ]; then
    echo ""
    echo "Running build test..."
    cd apps/web
    if BUILD_TARGET=firebase pnpm build > /dev/null 2>&1; then
        echo -e "7. Build test... ${GREEN}✓ Pass${NC}"
        ((PASSED++))
    else
        echo -e "7. Build test... ${RED}✗ Fail${NC}"
        ((FAILED++))
    fi
    cd ../..
fi

# Summary
echo ""
echo "======================================================"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! ($PASSED/$((PASSED+FAILED)))${NC}"
    echo ""
    echo "🚀 Ready to deploy:"
    echo "   ./deploy-production.sh"
    exit 0
else
    echo -e "${RED}❌ Some checks failed ($PASSED passed, $FAILED failed)${NC}"
    echo ""
    echo "Fix the issues above before deploying."
    exit 1
fi
