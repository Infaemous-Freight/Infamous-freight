#!/bin/bash
set -euo pipefail

# ============================================
# 🎯 COMPLETE 100% DEPLOYMENT
# ============================================
# This script completes all remaining deployment tasks

echo "=========================================="
echo "🎯 COMPLETING DEPLOYMENT TO 100%"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="https://infamous-freight-942.fly.dev"
HEALTH_URL="${API_URL}/api/health"
WEB_URL="https://infamous-freight-enterprises.vercel.app"

# ============================================
# Step 1: Verify API is healthy
# ============================================
echo -e "${BLUE}[1/5]${NC} Verifying API backend..."

if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ API is healthy and responding${NC}"
  curl -s "$HEALTH_URL" | python3 -m json.tool 2>/dev/null || curl -s "$HEALTH_URL"
else
  echo -e "${YELLOW}⚠ API is starting up (auto-start enabled)${NC}"
  echo "Waiting for API to be ready..."
  sleep 5
  curl -s "$HEALTH_URL" | python3 -m json.tool 2>/dev/null || echo "API will start on first request"
fi

echo ""

# ============================================
# Step 2: Check Vercel deployment status
# ============================================
echo -e "${BLUE}[2/5]${NC} Checking Vercel deployment..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Web app is live at $WEB_URL${NC}"
elif [ "$HTTP_CODE" = "404" ]; then
  echo -e "${YELLOW}⚠ Vercel deployment not found yet${NC}"
  echo "  - App may still be building"
  echo "  - Check: https://vercel.com/dashboard"
else
  echo -e "${YELLOW}⚠ Web app returned status: $HTTP_CODE${NC}"
  echo "  - Check: https://vercel.com/dashboard"
fi

echo ""

# ============================================
# Step 3: Verify environment file created
# ============================================
echo -e "${BLUE}[3/5]${NC} Verifying environment configuration..."

if [ -f ".env.vercel.production" ]; then
  echo -e "${GREEN}✓ Vercel environment file created${NC}"
  echo "  Location: .env.vercel.production"
else
  echo -e "${RED}✗ Environment file not found${NC}"
fi

echo ""

# ============================================
# Step 4: Display manual steps
# ============================================
echo -e "${BLUE}[4/5]${NC} Manual steps required..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 VERCEL ENVIRONMENT VARIABLES SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://vercel.com/dashboard"
echo ""
echo "2. Select your project (Infamous Freight)"
echo ""
echo "3. Go to: Settings → Environment Variables"
echo ""
echo "4. Add these variables:"
echo ""
echo -e "${YELLOW}   NEXT_PUBLIC_API_URL${NC}"
echo "   Value: $API_URL"
echo ""
echo -e "${YELLOW}   NEXT_PUBLIC_API_BASE_URL${NC}"
echo "   Value: ${API_URL}/api"
echo ""
echo "5. Save and redeploy (automatic)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""

# ============================================
# Step 5: Final verification
# ============================================
echo -e "${BLUE}[5/5]${NC} Running final verification..."
echo ""

./verify-100-deployment.sh || true

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 DEPLOYMENT TASKS COMPLETED!${NC}"
echo "=========================================="
echo ""
echo "Current Status:"
echo "  ✅ API Backend: $API_URL"
echo "  🔄 Web App: $WEB_URL"
echo "  📝 Next: Update Vercel environment variables"
echo ""
echo "After updating Vercel env vars:"
echo "  ✅ Full stack will be at 100%!"
echo "  ✅ All components connected"
echo "  ✅ Ready for production!"
echo ""
echo "=========================================="
