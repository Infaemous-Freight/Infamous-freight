#!/bin/bash
# 🚀 Complete 100% Auto-Deployment Setup
# This script configures all deployment credentials and validates the setup

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   100% Auto-Deployment Setup - Infamous Freight           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running in CI
if [ -n "$CI" ]; then
    echo -e "${YELLOW}⚠️  Running in CI environment - skipping interactive setup${NC}"
    exit 0
fi

# Function to check command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✅ $1 installed${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 not found${NC}"
        return 1
    fi
}

# Check required tools
echo "📦 Checking required tools..."
echo ""

MISSING_TOOLS=()

if ! check_command "gh"; then
    MISSING_TOOLS+=("GitHub CLI (gh)")
    echo "   Install: https://cli.github.com/"
fi

if ! check_command "flyctl"; then
    MISSING_TOOLS+=("Fly.io CLI (flyctl)")
    echo "   Install: curl -L https://fly.io/install.sh | sh"
fi

if ! check_command "vercel"; then
    MISSING_TOOLS+=("Vercel CLI")
    echo "   Install: pnpm add -g vercel@latest"
fi

if ! check_command "eas-cli" && ! check_command "eas"; then
    MISSING_TOOLS+=("Expo EAS CLI")
    echo "   Install: npm install -g eas-cli"
fi

echo ""

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some tools are missing. Install them to enable full setup.${NC}"
    echo -e "${YELLOW}   You can continue without them, but some steps will be skipped.${NC}"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# GitHub Secrets Setup
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Step 1: GitHub Secrets Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

if check_command "gh"; then
    # Check if authenticated
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✅ Authenticated with GitHub${NC}"
        
        echo ""
        echo "Setting up GitHub Secrets..."
        echo ""
        
        # Fly.io Token
        if [ -z "$(gh secret list | grep FLY_API_TOKEN)" ]; then
            echo "🔐 Fly.io API Token (FLY_API_TOKEN)"
            echo "   Get token: https://fly.io/user/personal_access_tokens"
            read -p "   Enter Fly.io token (or press Enter to skip): " FLY_TOKEN
            if [ -n "$FLY_TOKEN" ]; then
                echo "$FLY_TOKEN" | gh secret set FLY_API_TOKEN
                echo -e "${GREEN}   ✅ FLY_API_TOKEN set${NC}"
            fi
        else
            echo -e "${GREEN}✅ FLY_API_TOKEN already set${NC}"
        fi
        
        # Vercel Token
        if [ -z "$(gh secret list | grep VERCEL_TOKEN)" ]; then
            echo ""
            echo "🔐 Vercel Token (VERCEL_TOKEN)"
            echo "   Get token: https://vercel.com/account/tokens"
            read -p "   Enter Vercel token (or press Enter to skip): " VERCEL_TOKEN_INPUT
            if [ -n "$VERCEL_TOKEN_INPUT" ]; then
                echo "$VERCEL_TOKEN_INPUT" | gh secret set VERCEL_TOKEN
                echo -e "${GREEN}   ✅ VERCEL_TOKEN set${NC}"
            fi
        else
            echo -e "${GREEN}✅ VERCEL_TOKEN already set${NC}"
        fi
        
        # Expo Token
        if [ -z "$(gh secret list | grep EXPO_TOKEN)" ]; then
            echo ""
            echo "🔐 Expo Token (EXPO_TOKEN)"
            echo "   Get token: https://expo.dev/accounts/[account]/settings/access-tokens"
            read -p "   Enter Expo token (or press Enter to skip): " EXPO_TOKEN_INPUT
            if [ -n "$EXPO_TOKEN_INPUT" ]; then
                echo "$EXPO_TOKEN_INPUT" | gh secret set EXPO_TOKEN
                echo -e "${GREEN}   ✅ EXPO_TOKEN set${NC}"
            fi
        else
            echo -e "${GREEN}✅ EXPO_TOKEN already set${NC}"
        fi
        
        # API URL
        if [ -z "$(gh secret list | grep NEXT_PUBLIC_API_URL)" ]; then
            echo ""
            DEFAULT_API_URL="https://infamous-freight-api.fly.dev"
            read -p "API URL [$DEFAULT_API_URL]: " API_URL
            API_URL=${API_URL:-$DEFAULT_API_URL}
            echo "$API_URL" | gh secret set NEXT_PUBLIC_API_URL
            echo -e "${GREEN}   ✅ NEXT_PUBLIC_API_URL set${NC}"
        else
            echo -e "${GREEN}✅ NEXT_PUBLIC_API_URL already set${NC}"
        fi
        
    else
        echo -e "${YELLOW}⚠️  Not authenticated with GitHub CLI${NC}"
        echo "   Run: gh auth login"
        echo "   Then set secrets manually at:"
        echo "   https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/settings/secrets/actions"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI not installed${NC}"
    echo "   Set secrets manually at: https://github.com/settings/secrets"
fi

# Fly.io Setup
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Step 2: Fly.io Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

if check_command "flyctl"; then
    export PATH="/home/vscode/.fly/bin:$PATH"
    
    if flyctl auth whoami &> /dev/null; then
        echo -e "${GREEN}✅ Authenticated with Fly.io as: $(flyctl auth whoami)${NC}"
        
        echo ""
        read -p "Deploy API to Fly.io now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ./scripts/complete-fly-deploy.sh
        fi
    else
        echo -e "${YELLOW}⚠️  Not authenticated with Fly.io${NC}"
        echo "   Run: flyctl auth login"
        echo "   Or run: ./scripts/fly-auth.sh"
    fi
else
    echo -e "${YELLOW}⚠️  Fly.io CLI not installed${NC}"
fi

# Vercel Setup
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Step 3: Vercel Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

if check_command "vercel"; then
    if vercel whoami &> /dev/null; then
        echo -e "${GREEN}✅ Authenticated with Vercel as: $(vercel whoami)${NC}"
        
        # Link project if not linked
        if [ ! -f ".vercel/project.json" ]; then
            echo ""
            read -p "Link Vercel project now? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                vercel link
            fi
        else
            echo -e "${GREEN}✅ Vercel project linked${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Not authenticated with Vercel${NC}"
        echo "   Run: vercel login"
    fi
else
    echo -e "${YELLOW}⚠️  Vercel CLI not installed${NC}"
fi

# Expo Setup
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Step 4: Expo EAS Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

if check_command "eas-cli" || check_command "eas"; then
    EAS_CMD=$(command -v eas-cli || command -v eas)
    
    if $EAS_CMD whoami &> /dev/null; then
        echo -e "${GREEN}✅ Authenticated with Expo as: $($EAS_CMD whoami)${NC}"
        
        # Configure EAS if not configured
        if [ ! -f "apps/mobile/eas.json" ]; then
            echo ""
            read -p "Configure EAS for mobile app? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cd apps/mobile
                $EAS_CMD build:configure
                cd ../..
            fi
        else
            echo -e "${GREEN}✅ EAS configured${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Not authenticated with Expo${NC}"
        echo "   Run: eas login"
    fi
else
    echo -e "${YELLOW}⚠️  Expo EAS CLI not installed${NC}"
fi

# Validation
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Step 5: Validation${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

echo "Checking configuration..."
echo ""

# Check GitHub secrets
if check_command "gh" && gh auth status &> /dev/null; then
    echo "GitHub Secrets:"
    gh secret list | while read -r line; do
        echo "  ✅ $line"
    done
fi

echo ""
echo "Configuration files:"
[ -f "fly.toml" ] && echo -e "  ${GREEN}✅ fly.toml${NC}" || echo -e "  ${RED}❌ fly.toml${NC}"
[ -f "vercel.json" ] && echo -e "  ${GREEN}✅ vercel.json${NC}" || echo -e "  ${RED}❌ vercel.json${NC}"
[ -f "Dockerfile.fly" ] && echo -e "  ${GREEN}✅ Dockerfile.fly${NC}" || echo -e "  ${RED}❌ Dockerfile.fly${NC}"
[ -f ".github/workflows/auto-deploy.yml" ] && echo -e "  ${GREEN}✅ auto-deploy.yml${NC}" || echo -e "  ${RED}❌ auto-deploy.yml${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Setup Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

echo "🎯 Next Steps:"
echo ""
echo "1. Commit and push changes:"
echo "   ${GREEN}git add .${NC}"
echo "   ${GREEN}git commit -m 'Configure 100% auto-deployment'${NC}"
echo "   ${GREEN}git push origin main${NC}"
echo ""
echo "2. Monitor deployments:"
echo "   ${GREEN}gh run watch${NC}"
echo "   Or visit: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo ""
echo "3. Check deployment status:"
echo "   ${GREEN}./scripts/check-deployments.sh${NC}"
echo ""
echo "4. View live apps:"
echo "   🌐 Web: https://infamous-freight-enterprises.vercel.app"
echo "   🔌 API: https://infamous-freight-api.fly.dev/api/health"
echo "   📱 Mobile: https://expo.dev/@infamous-freight/mobile"
echo ""
echo -e "${GREEN}✅ Auto-deployment is now configured!${NC}"
echo ""
