#!/bin/bash
# monitoring-setup.sh - Automated Monitoring Configuration
# Infamous Freight Enterprises

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        📊 Monitoring & Alerting Setup - Infamous Freight      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# 1. UPTIME MONITORING
# ============================================
echo -e "${GREEN}✅ 1. UPTIME MONITORING (UptimeRobot)${NC}"
echo ""
echo "Steps to set up free uptime monitoring:"
echo ""
echo "1. Go to: https://uptimerobot.com"
echo "2. Sign up (free account)"
echo "3. Create New Monitor:"
echo "   - Monitor Type: HTTP(s)"
echo "   - Friendly Name: Infamous Freight Web"
echo "   - URL: https://your-app.vercel.app"
echo "   - Monitoring Interval: 5 minutes"
echo "4. Create another monitor for API:"
echo "   - Friendly Name: Infamous Freight API Health"
echo "   - URL: https://your-app.vercel.app/api/health"
echo "   - Monitoring Interval: 5 minutes"
echo "   - Alert Keyword: \"status\":\"ok\""
echo "5. Set up alerts:"
echo "   - Email notifications"
echo "   - Slack webhook (optional)"
echo ""
read -p "Press ENTER after setting up UptimeRobot..."

# ============================================
# 2. VERCEL ANALYTICS
# ============================================
echo ""
echo -e "${GREEN}✅ 2. VERCEL ANALYTICS (Built-in)${NC}"
echo ""
echo "Enable Vercel Analytics:"
echo ""
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Click 'Analytics' tab"
echo "4. Click 'Enable Analytics'"
echo ""
echo "Vercel automatically tracks:"
echo "- Page views & unique visitors"
echo "- Core Web Vitals (LCP, FID, CLS)"
echo "- Response times"
echo "- Status codes"
echo ""
read -p "Press ENTER after enabling Vercel Analytics..."

# ============================================
# 3. SENTRY ERROR TRACKING (Optional)
# ============================================
echo ""
echo -e "${GREEN}✅ 3. SENTRY ERROR TRACKING (Optional)${NC}"
echo ""
echo "Your code already has Sentry configured!"
echo "Just need to add DSN to Vercel:"
echo ""
echo "1. Go to: https://sentry.io"
echo "2. Create account / Sign in"
echo "3. Create new project: infamous-freight"
echo "4. Copy the DSN (looks like: https://xxx@sentry.io/xxx)"
echo "5. Go to Vercel → Settings → Environment Variables"
echo "6. Add:"
echo "   Name:  SENTRY_DSN"
echo "   Value: <your-dsn>"
echo "7. Add:"
echo "   Name:  NEXT_PUBLIC_SENTRY_DSN  "
echo "   Value: <your-dsn>"
echo "8. Redeploy Vercel"
echo ""
echo "Skip? (y/n)"
read -r skip_sentry
if [ "$skip_sentry" != "y" ]; then
read -p "Press ENTER after adding Sentry DSN..."
fi

# ============================================
# 4. SUPABASE ALERTS
# ============================================
echo ""
echo -e "${GREEN}✅ 4. SUPABASE USAGE ALERTS${NC}"
echo ""
echo "Set up Supabase alerts for free tier limits:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/wnaievjffghrztjuvutp"
echo "2. Settings → Billing"
echo "3. Enable alerts for:"
echo "   - Database size (alert at 400MB / 500MB limit)"
echo "   - API requests (alert at 40k / 50k limit)"
echo "   - Storage (alert at 800MB / 1GB limit)"
echo ""
read -p "Press ENTER after setting up Supabase alerts..."

# ============================================
# 5. HEALTH CHECK SCRIPT
# ============================================
echo ""
echo -e "${GREEN}✅ 5. CREATING HEALTH CHECK SCRIPT${NC}"
echo ""

cat > /workspaces/Infamous-freight-enterprises/health-check.sh << 'HEALTH_EOF'
#!/bin/bash
# health-check.sh - Quick deployment verification

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Your Vercel URL (update after deployment)
WEB_URL="${WEB_URL:-https://your-app.vercel.app}"
API_URL="${API_URL:-$WEB_URL/api/health}"

echo "🔍 Checking Infamous Freight deployment..."
echo ""

# Check web app
echo -n "Web App ($WEB_URL): "
if curl -s -f -o /dev/null "$WEB_URL"; then
  echo -e "${GREEN}✅ OK${NC}"
  WEB_STATUS="OK"
else
  echo -e "${RED}❌ FAILED${NC}"
  WEB_STATUS="FAILED"
fi

# Check API health
echo -n "API Health ($API_URL): "
HEALTH_RESPONSE=$(curl -s "$API_URL" 2>/dev/null || echo "{}")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✅ OK${NC}"
  API_STATUS="OK"
else
  echo -e "${RED}❌ FAILED${NC}"
  API_STATUS="FAILED"
fi

# Check database
echo -n "Database Connection: "
if echo "$HEALTH_RESPONSE" | grep -q '"database":"connected"'; then
  echo -e "${GREEN}✅ CONNECTED${NC}"
  DB_STATUS="CONNECTED"
else
  echo -e "${RED}❌ DISCONNECTED${NC}"
  DB_STATUS="DISCONNECTED"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$WEB_STATUS" = "OK" ] && [ "$API_STATUS" = "OK" ] && [ "$DB_STATUS" = "CONNECTED" ]; then
  echo -e "${GREEN}🎉 ALL SYSTEMS OPERATIONAL!${NC}"
  echo ""
  echo "✅ Web application is live"
  echo "✅ API is responding"
  echo "✅ Database is connected"
  echo ""
  echo "Your app is 100% deployed! 🌍"
  exit 0
else
  echo -e "${RED}⚠️  ISSUES DETECTED${NC}"
  echo ""
  [ "$WEB_STATUS" != "OK" ] && echo "❌ Web app not responding"
  [ "$API_STATUS" != "OK" ] && echo "❌ API not responding"
  [ "$DB_STATUS" != "CONNECTED" ] && echo "❌ Database not connected"
  echo ""
  echo "Check:"
  echo "1. Vercel deployment status"
  echo "2. Environment variables in Vercel"
  echo "3. Supabase database status"
  exit 1
fi
HEALTH_EOF

chmod +x /workspaces/Infamous-freight-enterprises/health-check.sh

echo -e "${GREEN}Created: health-check.sh${NC}"
echo "Run this anytime to check deployment status!"
echo ""

# ============================================
# 6. MONITORING DASHBOARD
# ============================================
echo -e "${GREEN}✅ 6. MONITORING DASHBOARD LINKS${NC}"
echo ""
echo "Bookmark these for monitoring:"
echo ""
echo "📊 Vercel Analytics:"
echo "   https://vercel.com/dashboard → Your Project → Analytics"
echo ""
echo "📈 Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/wnaievjffghrztjuvutp"
echo ""
echo "🔍 UptimeRobot Dashboard:"
echo "   https://uptimerobot.com/dashboard"
echo ""
echo "🐛 Sentry (if configured):"
echo "   https://sentry.io"
echo ""

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    ✅ MONITORING SETUP COMPLETE                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Configured:"
echo "✅ UptimeRobot - Uptime monitoring"
echo "✅ Vercel Analytics - Performance metrics"
echo "✅ Supabase Alerts - Usage warnings"
echo "✅ Health check script - Quick verification"
echo "✅ Sentry (optional) - Error tracking"
echo ""
echo "Test your deployment:"
echo "$ ./health-check.sh"
echo ""
echo "You'll know when things break before your users do! 📊"
echo ""
