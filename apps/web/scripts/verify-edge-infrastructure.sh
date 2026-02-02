#!/bin/bash
# Copyright © 2026 Infæmous Freight. All Rights Reserved.
# Vercel Edge Infrastructure Verification Script
# Tests all Edge features and reports status

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🔍 Edge Infrastructure Verification${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get deployment URL
if [ -n "$1" ]; then
    DEPLOY_URL="$1"
else
    echo "Reading deployment URL from Vercel..."
    DEPLOY_URL=$(vercel ls --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
fi

if [ -z "$DEPLOY_URL" ]; then
    echo -e "${YELLOW}⚠️  No deployment URL provided${NC}"
    echo "Usage: $0 <deployment-url>"
    echo "Example: $0 your-app.vercel.app"
    exit 1
fi

echo -e "${BLUE}🌐 Testing: https://$DEPLOY_URL${NC}"
echo ""

# Test 1: Check if site is accessible
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test 1: Site Accessibility${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" "https://$DEPLOY_URL")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 301 ] || [ "$HTTP_CODE" -eq 302 ]; then
    echo -e "${GREEN}✅ Site is accessible (HTTP $HTTP_CODE)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Site returned HTTP $HTTP_CODE${NC}"
    ((FAILED++))
fi
echo ""

# Test 2: Edge Proxy headers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test 2: Edge Proxy Headers${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEADERS=$(curl -s -I "https://$DEPLOY_URL" 2>/dev/null)

# Check geolocation headers
if echo "$HEADERS" | grep -qi "x-geo-country"; then
    GEO_COUNTRY=$(echo "$HEADERS" | grep -i "x-geo-country" | cut -d: -f2- | tr -d '[:space:]')
    echo -e "${GREEN}✅ Geolocation headers present (Country: $GEO_COUNTRY)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Geolocation headers not found${NC}"
    echo "   This is normal for local/preview deployments"
    ((WARNINGS++))
fi

# Check feature flags status
if echo "$HEADERS" | grep -qi "x-feature-flags-status"; then
    FLAGS_STATUS=$(echo "$HEADERS" | grep -i "x-feature-flags-status" | cut -d: -f2- | tr -d '[:space:]')
    echo -e "${GREEN}✅ Feature flags status: $FLAGS_STATUS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Feature flags status header not found${NC}"
    ((WARNINGS++))
fi
echo ""

# Test 3: Security headers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test 3: Security Headers${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SECURITY_HEADERS=(
    "strict-transport-security"
    "x-content-type-options"
    "x-frame-options"
    "referrer-policy"
    "permissions-policy"
)

for header in "${SECURITY_HEADERS[@]}"; do
    if echo "$HEADERS" | grep -qi "$header"; then
        echo -e "${GREEN}✅ $header${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  $header not found${NC}"
        ((WARNINGS++))
    fi
done
echo ""

# Test 4: Node.js version
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test 4: Build Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "../../vercel.json" ]; then
    NODE_VERSION=$(grep -o '"nodeVersion"[[:space:]]*:[[:space:]]*"[^"]*"' ../../vercel.json | cut -d'"' -f4)
    if [ "$NODE_VERSION" = "24.x" ]; then
        echo -e "${GREEN}✅ Node.js 24.x configured${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Node.js version: $NODE_VERSION (expected 24.x)${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  vercel.json not found${NC}"
    ((WARNINGS++))
fi
echo ""

# Test 5: Package installations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test 5: Required Packages${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "package.json" ]; then
    if grep -q "@vercel/edge-config" package.json; then
        echo -e "${GREEN}✅ @vercel/edge-config installed${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ @vercel/edge-config not found${NC}"
        ((FAILED++))
    fi
    
    if grep -q "@vercel/kv" package.json; then
        echo -e "${GREEN}✅ @vercel/kv installed${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ @vercel/kv not found${NC}"
        ((FAILED++))
    fi
    
    if grep -q "@vercel/analytics" package.json; then
        echo -e "${GREEN}✅ @vercel/analytics installed${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  @vercel/analytics not found${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌ package.json not found${NC}"
    ((FAILED++))
fi
echo ""

# Test 6: TypeScript compilation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test 6: TypeScript Compilation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if pnpm run typecheck >/dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    echo "   Run 'pnpm typecheck' for details"
    ((FAILED++))
fi
echo ""

# Test 7: Critical files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test 7: Critical Files${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CRITICAL_FILES=(
    "proxy.ts"
    "lib/edge-config.ts"
    "lib/kv-store.ts"
    "lib/analytics.ts"
    "vercel.json"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $file not found${NC}"
        ((FAILED++))
    fi
done
echo ""

# Test 8: Environment variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Test 8: Environment Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env.local" ] || [ -f ".env" ]; then
    echo -e "${GREEN}✅ Environment file present${NC}"
    ((PASSED++))
    
    ENV_FILE=".env.local"
    [ ! -f "$ENV_FILE" ] && ENV_FILE=".env"
    
    # Check for Edge Config
    if grep -q "EDGE_CONFIG" "$ENV_FILE" 2>/dev/null; then
        echo -e "${GREEN}✅ EDGE_CONFIG configured${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  EDGE_CONFIG not set (using fallbacks)${NC}"
        ((WARNINGS++))
    fi
    
    # Check for KV
    if grep -q "KV_" "$ENV_FILE" 2>/dev/null; then
        echo -e "${GREEN}✅ KV variables configured${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  KV variables not set (using memory cache)${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️  No environment file found${NC}"
    echo "   Run './scripts/setup-vercel-edge.sh' to configure"
    ((WARNINGS++))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Verification Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

TOTAL=$((PASSED + WARNINGS + FAILED))
SCORE=$((PASSED * 100 / TOTAL))

echo "Score: $SCORE% ($PASSED/$TOTAL tests passed)"
echo ""

if [ $FAILED -eq 0 ] && [ $WARNINGS -le 3 ]; then
    echo -e "${GREEN}🎉 Edge infrastructure is properly configured!${NC}"
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Edge infrastructure is working with some warnings${NC}"
    echo "Review warnings above for optional improvements"
    exit 0
else
    echo -e "${RED}❌ Edge infrastructure has critical issues${NC}"
    echo "Fix the failed tests above"
    exit 1
fi
