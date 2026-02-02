#!/bin/bash
# Copyright © 2026 Infæmous Freight. All Rights Reserved.
# Vercel Edge Infrastructure Setup Script
# Run this after deploying to Vercel to configure Edge Config and Redis

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🚀 Vercel Edge Infrastructure Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Install it with: npm i -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI found${NC}"
echo ""

# Check if project is linked
if [ ! -f ".vercel/project.json" ]; then
    echo -e "${YELLOW}⚠️  Project not linked to Vercel${NC}"
    echo "Run: vercel link"
    echo ""
    read -p "Link now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel link
    else
        echo "Please run 'vercel link' first"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Project linked to Vercel${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📦 Step 1: Edge Config Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Edge Config enables dynamic feature flags without redeployment"
echo ""
echo "Manual Steps Required:"
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Navigate to: Storage → Edge Config"
echo "3. Click: Create Edge Config"
echo "4. Name: feature-flags-production"
echo "5. Add initial configuration:"
echo ""
cat << 'EOF'
{
  "enableWebSockets": true,
  "enableRealTimeNotifications": true,
  "enableAdvancedAnalytics": true,
  "enablePayPal": true,
  "enableStripe": true,
  "enableCrypto": false,
  "enableDarkMode": true,
  "enableBetaFeatures": false,
  "enableA11yMode": true,
  "enableCDN": true,
  "enableImageOptimization": true,
  "enablePrefetching": true,
  "enabledRegions": ["US", "CA", "GB", "AU"],
  "maintenanceMode": false,
  "experiments": {
    "newDashboard": {
      "enabled": false,
      "rolloutPercentage": 0,
      "variants": ["control", "variant-a"]
    }
  }
}
EOF
echo ""
echo "6. Link to your project"
echo "7. Copy the EDGE_CONFIG connection string"
echo ""
read -p "Press Enter when Edge Config is created and linked..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📦 Step 2: Redis/KV Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Redis provides distributed caching across all edge regions"
echo ""
echo "Manual Steps Required:"
echo "1. Go to: https://vercel.com/marketplace"
echo "2. Search: redis"
echo "3. Select: Upstash Redis (recommended)"
echo "4. Click: Add Integration"
echo "5. Create new database:"
echo "   - Name: infamous-freight-cache"
echo "   - Region: Choose closest to your users"
echo "   - Type: Regional (or Global for multi-region)"
echo "6. Link to your project"
echo "7. Environment variables will be auto-added"
echo ""
read -p "Press Enter when Redis is created and linked..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📦 Step 3: Pull Environment Variables${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Pulling environment variables from Vercel..."
vercel env pull .env.local
echo ""
echo -e "${GREEN}✅ Environment variables pulled${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📦 Step 4: Verify Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for required environment variables
if [ -f ".env.local" ]; then
    echo "Checking .env.local for required variables..."
    echo ""
    
    MISSING_VARS=()
    
    if ! grep -q "EDGE_CONFIG=" .env.local; then
        MISSING_VARS+=("EDGE_CONFIG")
    else
        echo -e "${GREEN}✅ EDGE_CONFIG found${NC}"
    fi
    
    if ! grep -q "KV_REST_API_URL=" .env.local && ! grep -q "KV_URL=" .env.local; then
        MISSING_VARS+=("KV_* variables")
    else
        echo -e "${GREEN}✅ KV variables found${NC}"
    fi
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  Missing variables: ${MISSING_VARS[*]}${NC}"
        echo "Make sure Edge Config and Redis are properly linked in Vercel Dashboard"
    else
        echo ""
        echo -e "${GREEN}✅ All required variables present${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    echo "Run: vercel env pull .env.local"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📦 Step 5: Test Deployment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Testing the deployment..."
echo ""

PROJECT_URL=$(vercel inspect --json | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_URL" ]; then
    echo -e "${YELLOW}⚠️  Could not detect project URL${NC}"
    echo "Get your URL from: https://vercel.com/dashboard"
else
    echo -e "${GREEN}✅ Project URL: $PROJECT_URL${NC}"
    echo ""
    echo "Testing Edge Proxy headers..."
    curl -I "https://$PROJECT_URL" 2>/dev/null | grep -i "x-geo\|x-feature-flags" || echo "Headers check: Run manually with 'curl -I https://$PROJECT_URL'"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next Steps:"
echo "1. Monitor deployments: https://vercel.com/dashboard"
echo "2. View Edge Config: https://vercel.com/dashboard → Storage → Edge Config"
echo "3. View Redis metrics: https://vercel.com/dashboard → Storage → Redis"
echo "4. Test your app: https://$PROJECT_URL"
echo ""
echo "Verification Commands:"
echo "• Test middleware: curl -I https://$PROJECT_URL"
echo "• Run type check: pnpm typecheck"
echo "• Run tests: pnpm test"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "• VERCEL_100_PERCENT_COMPLETE.md"
echo "• ALL_RECOMMENDATIONS_ENHANCED_100.md"
echo ""
echo -e "${GREEN}✨ Your Edge infrastructure is ready!${NC}"
echo ""
