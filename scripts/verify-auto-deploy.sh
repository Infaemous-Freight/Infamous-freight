#!/bin/bash

# Verify 100% Auto-Deployment Configuration
# This script checks that everything is properly configured

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================"
echo "🔍 Auto-Deploy Configuration Verification"
echo "================================"
echo ""

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
    else
        echo -e "${RED}❌${NC} $1 - NOT FOUND"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check executable
check_executable() {
    if [ -x "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 (executable)"
    else
        echo -e "${YELLOW}⚠️${NC} $1 (not executable)"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Function to check command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        VERSION=$($1 --version 2>&1 | head -n 1)
        echo -e "${GREEN}✅${NC} $1 - $VERSION"
    else
        echo -e "${RED}❌${NC} $1 - NOT INSTALLED"
        ERRORS=$((ERRORS + 1))
    fi
}

# Check required files
echo "📄 Checking Configuration Files..."
check_file "fly.toml"
check_file "Dockerfile.fly"
check_file "vercel.json"
check_file ".vercelignore"
check_file "src/apps/mobile/eas.json"
check_file ".github/workflows/auto-deploy.yml"
check_file ".github/workflows/mobile-deploy.yml"
check_file ".github/workflows/ci.yml"
check_file ".github/workflows/cd.yml"
echo ""

# Check scripts
echo "🔧 Checking Deployment Scripts..."
check_executable "scripts/setup-auto-deploy.sh"
check_executable "scripts/complete-fly-deploy.sh"
check_executable "scripts/check-deployments.sh"
check_executable "scripts/fly-migrate.sh"
echo ""

# Check CLI tools
echo "🛠️  Checking CLI Tools..."
check_command "node"
check_command "pnpm"
check_command "flyctl"
check_command "gh"

# Optional tools
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅${NC} vercel - $(vercel --version)"
else
    echo -e "${YELLOW}⚠️${NC} vercel - not installed (optional, install with: pnpm add -g vercel@latest)"
    WARNINGS=$((WARNINGS + 1))
fi

if command -v eas &> /dev/null; then
    echo -e "${GREEN}✅${NC} eas - $(eas --version)"
else
    echo -e "${YELLOW}⚠️${NC} eas - not installed (optional, install with: npm i -g eas-cli)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check GitHub secrets (requires gh CLI)
echo "🔐 Checking GitHub Secrets..."
if command -v gh &> /dev/null; then
    SECRETS=$(gh secret list 2>/dev/null || echo "")
    
    check_secret() {
        if echo "$SECRETS" | grep -q "^$1"; then
            echo -e "${GREEN}✅${NC} $1"
        else
            echo -e "${RED}❌${NC} $1 - NOT SET"
            ERRORS=$((ERRORS + 1))
        fi
    }
    
    check_secret "FLY_API_TOKEN"
    check_secret "VERCEL_TOKEN"
    check_secret "EXPO_TOKEN"
    check_secret "NEXT_PUBLIC_API_URL"
else
    echo -e "${YELLOW}⚠️${NC} Cannot check secrets (gh CLI not installed)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check documentation
echo "📚 Checking Documentation..."
check_file "deploy/100_PERCENT_AUTO_DEPLOY.md"
check_file "deploy/AUTO_DEPLOY_SETUP.md"
check_file "deploy/FLY_TROUBLESHOOTING.md"
check_file "deploy/FLY_MONITORING.md"
check_file "deploy/FLY_RECOMMENDATIONS.md"
check_file "DEPLOYMENT_STATUS.md"
echo ""

# Check workflow syntax
echo "✨ Validating Workflow Syntax..."
if command -v gh &> /dev/null; then
    WORKFLOWS=".github/workflows/*.yml"
    for workflow in $WORKFLOWS; do
        if [ -f "$workflow" ]; then
            # Basic YAML syntax check
            if grep -q "^on:" "$workflow" && grep -q "^jobs:" "$workflow"; then
                echo -e "${GREEN}✅${NC} $(basename $workflow) - valid structure"
            else
                echo -e "${RED}❌${NC} $(basename $workflow) - invalid structure"
                ERRORS=$((ERRORS + 1))
            fi
        fi
    done
else
    echo -e "${YELLOW}⚠️${NC} Cannot validate workflows (gh CLI not available)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check environment setup
echo "🌍 Checking Environment..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅${NC} .env file exists"
    
    # Check critical env vars
    if grep -q "DATABASE_URL=" .env 2>/dev/null; then
        echo -e "${GREEN}✅${NC} DATABASE_URL configured"
    else
        echo -e "${YELLOW}⚠️${NC} DATABASE_URL not set in .env"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if grep -q "JWT_SECRET=" .env 2>/dev/null; then
        echo -e "${GREEN}✅${NC} JWT_SECRET configured"
    else
        echo -e "${YELLOW}⚠️${NC} JWT_SECRET not set in .env"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠️${NC} .env file not found (copy from .env.example)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "================================"
echo "📊 Verification Summary"
echo "================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Perfect! Everything is configured correctly!${NC}"
    echo ""
    echo "Your auto-deployment is 100% ready:"
    echo -e "  ${GREEN}✅${NC} All configuration files present"
    echo -e "  ${GREEN}✅${NC} All required tools installed"
    echo -e "  ${GREEN}✅${NC} All GitHub secrets configured"
    echo -e "  ${GREEN}✅${NC} All workflows valid"
    echo ""
    echo "Next steps:"
    echo "  1. Push to main branch to trigger auto-deploy"
    echo "  2. Monitor deployments: ./scripts/check-deployments.sh"
    echo "  3. View logs: flyctl logs --app infamous-freight-api"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Configuration is mostly complete with $WARNINGS warnings${NC}"
    echo ""
    echo "Warnings are optional items. Your deployment should work."
    echo "Run ./scripts/setup-auto-deploy.sh to complete setup."
    echo ""
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS errors and $WARNINGS warnings${NC}"
    echo ""
    echo "Critical issues found! Please fix before deploying:"
    echo "  • Missing required files or secrets"
    echo "  • Required CLI tools not installed"
    echo "  • Invalid workflow configuration"
    echo ""
    echo "Fix by running:"
    echo "  ./scripts/setup-auto-deploy.sh"
    echo ""
    exit 1
fi
