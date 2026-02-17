#!/bin/bash
# Check deployment status for all services

set -e

echo "🔍 Deployment Status Check"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Web (Vercel)
echo "📱 Checking Web Application..."
WEB_URL="https://infamous-freight-enterprises.vercel.app"
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" || echo "000")

if [ "$WEB_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Web is live${NC} - $WEB_URL (HTTP $WEB_STATUS)"
else
    echo -e "${RED}❌ Web is down${NC} - $WEB_URL (HTTP $WEB_STATUS)"
fi

echo ""

# Check API (Fly.io)
echo "🔌 Checking API..."
API_URL="https://infamous-freight-api.fly.dev/api/health"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" || echo "000")

if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API is live${NC} - $API_URL (HTTP $API_STATUS)"
    
    # Get detailed health info
    API_HEALTH=$(curl -s "$API_URL" || echo "{}")
    echo "   Uptime: $(echo "$API_HEALTH" | grep -o '"uptime":[0-9.]*' | cut -d':' -f2) seconds"
else
    echo -e "${RED}❌ API is down${NC} - $API_URL (HTTP $API_STATUS)"
fi

echo ""

# Check Mobile (Expo)
echo "📱 Checking Mobile App..."
EXPO_URL="https://expo.dev/@infamous-freight/mobile"
EXPO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$EXPO_URL" || echo "000")

if [ "$EXPO_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Mobile project is live${NC} - $EXPO_URL"
else
    echo -e "${YELLOW}⚠️  Mobile status unknown${NC} - $EXPO_URL (HTTP $EXPO_STATUS)"
fi

echo ""

# Check GitHub Actions
echo "🔄 Checking CI/CD Status..."
if command -v gh &> /dev/null; then
    echo "Latest workflow runs:"
    gh run list --limit 3 --json status,conclusion,name,createdAt,databaseId,url \
      --jq '.[] | "   \(.name): \(.status) (\(.conclusion // "running")) - \(.url)"'
else
    echo -e "${YELLOW}⚠️  GitHub CLI not installed. Install with: brew install gh${NC}"
    echo "   View runs at: https://github.com/MrMiless44/Infamous-freight-enterprises/actions"
fi

echo ""
echo "================================"
echo "🎯 Summary"
echo "================================"

SERVICES_UP=0
SERVICES_TOTAL=3

[ "$WEB_STATUS" = "200" ] && SERVICES_UP=$((SERVICES_UP + 1))
[ "$API_STATUS" = "200" ] && SERVICES_UP=$((SERVICES_UP + 1))
[ "$EXPO_STATUS" = "200" ] && SERVICES_UP=$((SERVICES_UP + 1))

if [ $SERVICES_UP -eq $SERVICES_TOTAL ]; then
    echo -e "${GREEN}✅ All services operational ($SERVICES_UP/$SERVICES_TOTAL)${NC}"
    exit 0
elif [ $SERVICES_UP -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some services down ($SERVICES_UP/$SERVICES_TOTAL)${NC}"
    exit 1
else
    echo -e "${RED}❌ All services down (0/$SERVICES_TOTAL)${NC}"
    exit 1
fi
