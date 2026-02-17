#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Vercel Deployment Verification Script
# Run this before deploying to Vercel to ensure all configurations are correct

set -e

echo "🔍 Vercel Deployment Configuration Verification"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track errors
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

# 1. Check package.json configuration
echo "📦 Checking root package.json..."
if [ -f "package.json" ]; then
    PACKAGE_MANAGER=$(grep -o '"packageManager"[^,]*' package.json | cut -d'"' -f4)
    NODE_VERSION=$(grep -o '"node"[^,]*' package.json | cut -d'"' -f4)
    
    if [[ "$PACKAGE_MANAGER" == "pnpm@9.15.0" ]]; then
        check_pass "packageManager is set to pnpm@9.15.0"
    else
        check_fail "packageManager should be 'pnpm@9.15.0', found: $PACKAGE_MANAGER"
    fi
    
    if [[ "$NODE_VERSION" == "20.x" ]]; then
        check_pass "Node.js version is set to 20.x"
    else
        check_fail "Node.js version should be '20.x', found: $NODE_VERSION"
    fi
else
    check_fail "package.json not found in root"
fi
echo ""

# 2. Check .npmrc
echo "⚙️  Checking .npmrc..."
if [ -f ".npmrc" ]; then
    if grep -q "engine-strict=true" .npmrc; then
        check_pass "engine-strict=true is set in .npmrc"
    else
        check_fail "engine-strict=true not found in .npmrc"
    fi
else
    check_fail ".npmrc not found in root"
fi
echo ""

# 3. Check apps/web/package.json
echo "🌐 Checking apps/web/package.json..."
if [ -f "apps/web/package.json" ]; then
    if grep -q '"next":' apps/web/package.json; then
        NEXT_VERSION=$(grep -o '"next"[^,]*' apps/web/package.json | cut -d'"' -f4)
        check_pass "Next.js dependency found: $NEXT_VERSION"
    else
        check_fail "Next.js dependency not found in apps/web/package.json"
    fi
    
    if grep -q '"react":' apps/web/package.json; then
        REACT_VERSION=$(grep -o '"react"[^,]*' apps/web/package.json | cut -d'"' -f4)
        check_pass "React dependency found: $REACT_VERSION"
    else
        check_fail "React dependency not found in apps/web/package.json"
    fi
    
    if grep -q '"react-dom":' apps/web/package.json; then
        REACT_DOM_VERSION=$(grep -o '"react-dom"[^,]*' apps/web/package.json | cut -d'"' -f4)
        check_pass "React-DOM dependency found: $REACT_DOM_VERSION"
    else
        check_fail "React-DOM dependency not found in apps/web/package.json"
    fi
else
    check_fail "apps/web/package.json not found"
fi
echo ""

# 4. Check health endpoint
echo "🏥 Checking health endpoint..."
if [ -f "apps/web/pages/api/health.ts" ]; then
    check_pass "Health endpoint exists at apps/web/pages/api/health.ts"
else
    check_fail "Health endpoint not found at apps/web/pages/api/health.ts"
fi
echo ""

# 5. Check critical files not in .vercelignore
echo "🚫 Checking .vercelignore..."
if [ -f ".vercelignore" ]; then
    # Check if critical files are NOT ignored
    CRITICAL_FILES=(
        "pnpm-lock.yaml"
        "pnpm-workspace.yaml"
        "apps/web/package.json"
        "packages"
    )
    
    for file in "${CRITICAL_FILES[@]}"; do
        if grep -q "$file" .vercelignore 2>/dev/null; then
            check_fail "$file is excluded in .vercelignore (should NOT be ignored)"
        else
            check_pass "$file is not excluded in .vercelignore"
        fi
    done
else
    check_fail ".vercelignore not found"
fi
echo ""

# 6. Check pnpm-workspace.yaml
echo "📁 Checking pnpm-workspace.yaml..."
if [ -f "pnpm-workspace.yaml" ]; then
    if grep -q "apps/\*" pnpm-workspace.yaml && grep -q "packages/\*" pnpm-workspace.yaml; then
        check_pass "pnpm-workspace.yaml is configured correctly"
    else
        check_warn "pnpm-workspace.yaml may not be configured properly"
    fi
else
    check_fail "pnpm-workspace.yaml not found"
fi
echo ""

# 7. Check vercel.json configurations
echo "⚡ Checking vercel.json configurations..."
if [ -f "vercel.json" ]; then
    if grep -q '"nodeVersion": "20.x"' vercel.json; then
        check_pass "Root vercel.json uses Node 20.x"
    else
        check_fail "Root vercel.json should use Node 20.x"
    fi
else
    check_warn "Root vercel.json not found"
fi

if [ -f "apps/web/vercel.json" ]; then
    if grep -q '"nodeVersion": "20.x"' apps/web/vercel.json; then
        check_pass "apps/web/vercel.json uses Node 20.x"
    else
        check_fail "apps/web/vercel.json should use Node 20.x"
    fi
    
    if grep -q 'corepack enable' apps/web/vercel.json; then
        check_pass "apps/web/vercel.json installCommand includes corepack enable"
    else
        check_warn "apps/web/vercel.json installCommand should include corepack enable"
    fi
    
    if grep -q '\-\-frozen\-lockfile' apps/web/vercel.json; then
        check_pass "apps/web/vercel.json uses --frozen-lockfile"
    else
        check_warn "apps/web/vercel.json should use --frozen-lockfile"
    fi
else
    check_warn "apps/web/vercel.json not found"
fi
echo ""

# 8. Check environment variable examples
echo "🔐 Checking environment variable documentation..."
if [ -f "apps/web/.env.example" ]; then
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" apps/web/.env.example; then
        check_pass "NEXT_PUBLIC_SUPABASE_URL documented in .env.example"
    else
        check_fail "NEXT_PUBLIC_SUPABASE_URL not documented in .env.example"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" apps/web/.env.example; then
        check_pass "NEXT_PUBLIC_SUPABASE_ANON_KEY documented in .env.example"
    else
        check_fail "NEXT_PUBLIC_SUPABASE_ANON_KEY not documented in .env.example"
    fi
else
    check_warn "apps/web/.env.example not found"
fi
echo ""

# 9. Check if lockfile exists
echo "🔒 Checking lockfile..."
if [ -f "pnpm-lock.yaml" ]; then
    check_pass "pnpm-lock.yaml exists"
else
    check_fail "pnpm-lock.yaml not found - run 'pnpm install' first"
fi
echo ""

# Summary
echo "=============================================="
echo "📊 Verification Summary"
echo "=============================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your repository is ready for Vercel deployment."
    echo ""
    echo "Next steps:"
    echo "1. Commit and push changes: git add . && git commit -m 'fix: Configure Vercel deployment' && git push"
    echo "2. Configure Vercel dashboard settings (see VERCEL_DEPLOYMENT_SETUP.md)"
    echo "3. Add environment variables in Vercel dashboard"
    echo "4. Deploy with cache cleared"
    echo "5. Test /api/health endpoint"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Passed with $WARNINGS warning(s)${NC}"
    echo ""
    echo "You can proceed with deployment, but review the warnings above."
    exit 0
else
    echo -e "${RED}✗ Failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before deploying to Vercel."
    echo "See VERCEL_DEPLOYMENT_SETUP.md for detailed instructions."
    exit 1
fi
