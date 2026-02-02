#!/bin/bash
# Infamous Freight Enterprises - Deployment Verification Script
# Checks the status of all production deployments

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# URLs to check
WEB_URL="https://infamous-freight-enterprises-git-main-santorio-miles-projects.vercel.app"
API_URL="https://infamous-freight-api.fly.dev"
GITHUB_REPO="https://github.com/MrMiless44/Infamous-freight"

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    INFAMOUS FREIGHT ENTERPRISES - DEPLOYMENT VERIFICATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}🔍 Checking deployment status...${NC}"
echo ""

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    local expected_code=${3:-200}
    
    echo -n "Checking $name... "
    
    if command -v curl &> /dev/null; then
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
        
        if [ "$response" = "$expected_code" ] || [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
            echo -e "${GREEN}✅ LIVE (HTTP $response)${NC}"
            return 0
        else
            echo -e "${YELLOW}⏳ Deploying (HTTP $response)${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  curl not available${NC}"
        return 1
    fi
}

# Check Web App
echo -e "${PURPLE}━━━ WEB APPLICATION (Vercel) ━━━${NC}"
check_url "$WEB_URL" "Web App"
WEB_STATUS=$?
echo -e "  URL: ${CYAN}$WEB_URL${NC}"
echo ""

# Check API
echo -e "${PURPLE}━━━ API BACKEND (Fly.io) ━━━${NC}"
check_url "$API_URL/api/health" "API Health"
API_STATUS=$?
echo -e "  URL: ${CYAN}$API_URL${NC}"
echo ""

# Check GitHub
echo -e "${PURPLE}━━━ SOURCE CODE (GitHub) ━━━${NC}"
check_url "$GITHUB_REPO" "GitHub Repository"
GITHUB_STATUS=$?
echo -e "  URL: ${CYAN}$GITHUB_REPO${NC}"
echo ""

# Summary
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                      DEPLOYMENT SUMMARY${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

TOTAL=3
SUCCESS=0

if [ $WEB_STATUS -eq 0 ]; then ((SUCCESS++)); fi
if [ $API_STATUS -eq 0 ]; then ((SUCCESS++)); fi
if [ $GITHUB_STATUS -eq 0 ]; then ((SUCCESS++)); fi

PERCENTAGE=$((SUCCESS * 100 / TOTAL))

echo -e "  Web Application:  $([ $WEB_STATUS -eq 0 ] && echo -e '${GREEN}✅ LIVE${NC}' || echo -e '${YELLOW}⏳ DEPLOYING${NC}')"
echo -e "  API Backend:      $([ $API_STATUS -eq 0 ] && echo -e '${GREEN}✅ LIVE${NC}' || echo -e '${YELLOW}⏳ PENDING${NC}')"
echo -e "  GitHub Repo:      $([ $GITHUB_STATUS -eq 0 ] && echo -e '${GREEN}✅ LIVE${NC}' || echo -e '${YELLOW}⏳ CHECKING${NC}')"
echo ""
echo -e "  ${CYAN}Overall Status: $SUCCESS/$TOTAL services ($PERCENTAGE%)${NC}"
echo ""

if [ $PERCENTAGE -eq 100 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║           🎉 100% DEPLOYED - ALL SYSTEMS OPERATIONAL! 🎉       ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
elif [ $PERCENTAGE -ge 66 ]; then
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║        🚀 DEPLOYMENT IN PROGRESS - ALMOST THERE!              ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║         ⏳ DEPLOYMENT STARTING - PLEASE WAIT...               ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
fi

echo ""
echo -e "${BLUE}━━━ MONITORING LINKS ━━━${NC}"
echo -e "  📊 GitHub Actions: ${CYAN}https://github.com/MrMiless44/Infamous-freight/actions${NC}"
echo -e "  🌐 Vercel Dashboard: ${CYAN}https://vercel.com/dashboard${NC}"
echo -e "  📱 Web App: ${CYAN}$WEB_URL${NC}"
echo -e "  🔌 API: ${CYAN}$API_URL${NC}"
echo ""

# Next steps if not fully deployed
if [ $PERCENTAGE -lt 100 ]; then
    echo -e "${YELLOW}━━━ NEXT STEPS ━━━${NC}"
    
    if [ $WEB_STATUS -ne 0 ]; then
        echo -e "  ${YELLOW}1.${NC} Monitor web deployment at: https://vercel.com/dashboard"
    fi
    
    if [ $API_STATUS -ne 0 ]; then
        echo -e "  ${YELLOW}2.${NC} Add FLY_API_TOKEN to GitHub Secrets to enable API deployment"
        echo -e "     Visit: https://github.com/MrMiless44/Infamous-freight/settings/secrets/actions"
    fi
    
    echo ""
fi

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Return exit code based on percentage
if [ $PERCENTAGE -eq 100 ]; then
    exit 0
elif [ $PERCENTAGE -ge 50 ]; then
    exit 1
else
    exit 2
fi
