#!/bin/bash
# Monitoring Services Setup
# Templates and guides for setting up error tracking, APM, and health checks

set -e

echo "📊 Monitoring Services Setup Guide"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

REPO="MrMiless44/Infamous-freight-enterprises"

# Function to add secret via gh CLI
add_secret() {
    local secret_name=$1
    local secret_value=$2
    local repo=$3
    
    if command -v gh &> /dev/null; then
        gh secret set "$secret_name" --repo "$repo" <<< "$secret_value"
        echo -e "${GREEN}✅ $secret_name set${NC}"
    else
        echo -e "${YELLOW}⚠️  gh CLI not found, set manually at:${NC}"
        echo "   https://github.com/$repo/settings/secrets/actions"
    fi
}

echo -e "${BLUE}OPTION 1: Sentry (Error Tracking)${NC}"
echo "═════════════════════════════════════"
echo ""
echo "Benefits:"
echo "  • Error tracking & alerting"
echo "  • Performance monitoring"
echo "  • Release tracking"
echo "  • Free tier: 5,000 errors/month"
echo ""
echo "Setup Steps:"
echo "  1. Sign up: https://sentry.io/signup/"
echo "  2. Create new organization"
echo "  3. Create new project: 'infamous-freight-api'"
echo "  4. Select platform: Node.js"
echo "  5. Copy DSN from project settings"
echo ""
read -p "Do you want to set Sentry DSN now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Paste your Sentry DSN (https://...@sentry.io/...): " sentry_dsn
    if [ ! -z "$sentry_dsn" ]; then
        add_secret "SENTRY_DSN" "$sentry_dsn" "$REPO"
        
        # Also set in Fly.io
        if command -v flyctl &> /dev/null; then
            read -p "Also set in Fly.io? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                flyctl secrets set SENTRY_DSN="$sentry_dsn" --app infamous-freight-api
            fi
        fi
    fi
fi
echo ""

# Option 2: Datadog
echo -e "${BLUE}OPTION 2: Datadog (APM & Monitoring)${NC}"
echo "═════════════════════════════════════"
echo ""
echo "Benefits:"
echo "  • Application Performance Monitoring"
echo "  • Real User Monitoring (RUM)"
echo "  • Log Management"
echo "  • 14-day free trial"
echo ""
echo "Setup Steps:"
echo "  1. Sign up: https://www.datadoghq.com/"
echo "  2. Create API key at https://app.datadoghq.com/organization-settings/api-keys"
echo "  3. Choose your region (US-East for iad)"
echo ""
read -p "Do you want to set Datadog keys now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Paste your Datadog API Key: " dd_api_key
    if [ ! -z "$dd_api_key" ]; then
        echo "Setting Datadog secrets..."
        
        if command -v flyctl &> /dev/null; then
            flyctl secrets set \
                DD_TRACE_ENABLED="true" \
                DD_API_KEY="$dd_api_key" \
                DD_SERVICE="infamous-freight-api" \
                DD_ENV="production" \
                DD_RUNTIME_METRICS_ENABLED="true" \
                --app infamous-freight-api
            
            echo -e "${GREEN}✅ Datadog APM enabled${NC}"
        fi
    fi
fi
echo ""

# Option 3: Uptime Robot
echo -e "${BLUE}OPTION 3: Uptime Robot (Health Monitoring)${NC}"
echo "═════════════════════════════════════"
echo ""
echo "Benefits:"
echo "  • Website uptime monitoring"
echo "  • Alert notifications"
echo "  • Status page"
echo "  • Free tier: 50 monitors"
echo ""
echo "Setup Steps:"
echo "  1. Sign up: https://uptimerobot.com/"
echo "  2. Click 'Add New Monitor'"
echo "  3. Select 'HTTP(s)' type"
echo ""
echo "Monitor 1 - API Health:"
echo "  • Name: Infamous Freight API"
echo "  • URL: https://infamous-freight-api.fly.dev/api/health"
echo "  • Interval: 5 minutes"
echo "  • Timeout: 30 seconds"
echo ""
echo "Monitor 2 - Web Frontend:"
echo "  • Name: Infamous Freight Web"
echo "  • URL: https://infamous-freight-enterprises.fly.dev"
echo "  • Interval: 5 minutes"
echo "  • Timeout: 30 seconds"
echo ""
echo "4. Configure Alerts:"
echo "  • Email"
echo "  • SMS"
echo "  • Slack (add Slack integration)"
echo ""
read -p "Press Enter when Uptime Robot is configured..."
echo ""

# Option 4: Datadog RUM (Web Frontend)
echo -e "${BLUE}OPTION 4: Datadog RUM (Web Monitoring)${NC}"
echo "═════════════════════════════════════"
echo ""
echo "Benefits:"
echo "  • Real User Monitoring"
echo "  • Frontend Performance Metrics"
echo "  • Session Recording"
echo "  • Error Tracking"
echo ""
echo "Setup Steps (if Datadog enabled above):"
echo "  1. Get Application ID: https://app.datadoghq.com/rum/list"
echo "  2. Create RUM Application"
echo "  3. Get Client Token"
echo ""
read -p "Do you have Datadog RUM credentials? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Datadog App ID: " dd_app_id
    read -p "Datadog Client Token: " dd_client_token
    
    if [ ! -z "$dd_app_id" ] && [ ! -z "$dd_client_token" ]; then
        echo "Note: Set these in Vercel dashboard environment variables:"
        echo "  NEXT_PUBLIC_DD_APP_ID=$dd_app_id"
        echo "  NEXT_PUBLIC_DD_CLIENT_TOKEN=$dd_client_token"
        echo "  NEXT_PUBLIC_DD_SITE=datadoghq.com"
        echo "  NEXT_PUBLIC_DD_SERVICE=infamous-freight-web"
        echo ""
        echo "Then redeploy: vercel --prod (or git push if using Vercel GitHub integration)"
    fi
fi
echo ""

# Option 5: Vercel Analytics
echo -e "${BLUE}OPTION 5: Vercel Analytics (Web Performance)${NC}"
echo "═════════════════════════════════════"
echo ""
echo "Benefits (already configured):"
echo "  • Core Web Vitals"
echo "  • Lighthouse Performance"
echo "  • Real User Monitoring"
echo "  • Free with Vercel"
echo ""
echo "To enable:"
echo "  1. Go to https://vercel.com/dashboard"
echo "  2. Select project: infamous-freight-enterprises"
echo "  3. Go to Analytics tab"
echo "  4. Click 'Enable Web Analytics'"
echo ""
read -p "Press Enter after enabling Vercel Analytics..."
echo ""

# Summary
echo -e "${BLUE}═════════════════════════════════════${NC}"
echo -e "${GREEN}✅ MONITORING SETUP GUIDE COMPLETE${NC}"
echo -e "${BLUE}═════════════════════════════════════${NC}"
echo ""
echo "Recommended Setup (All together):"
echo "  • Sentry: Error tracking ✅"
echo "  • Datadog: APM + RUM ✅"
echo "  • Uptime Robot: Health checks ✅"
echo "  • Vercel Analytics: Web performance ✅"
echo ""
echo "Minimum Viable Setup:"
echo "  • Sentry: Error tracking (required)"
echo "  • Uptime Robot: Health checks (required)"
echo ""
echo "Next Steps:"
echo "  1. Verify all endpoints are responding:"
curl -s https://infamous-freight-api.fly.dev/api/health | head -c 50 && echo "..." || echo "(may take a moment)"
echo "  2. Check logs for errors:"
echo "     flyctl logs --app infamous-freight-api --tail 100"
echo "  3. Monitor dashboards:"
echo "     • Sentry: https://sentry.io"
echo "     • Datadog: https://app.datadoghq.com"
echo "     • Uptime Robot: https://uptimerobot.com"
echo ""
