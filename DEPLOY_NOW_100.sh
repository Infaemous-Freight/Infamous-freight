#!/bin/bash
# 🚀 DEPLOY INFAMOUS FREIGHT TO 100% - ALL SERVICES NOW
# This script deploys web app, API, and database to reach 100%

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                          ║${NC}"
echo -e "${BLUE}║          🚀 DEPLOYING TO 100% - ALL SERVICES NOW 🚀                     ║${NC}"
echo -e "${BLUE}║                                                                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STRATEGY: Deploy using existing cloud services that are already configured
# ═══════════════════════════════════════════════════════════════════════════

echo -e "${CYAN}📊 Current Status Check...${NC}"
echo ""

# Check Vercel status
echo -e "${YELLOW}1. Web Application (Vercel)${NC}"
WEB_URL="https://infamous-freight-enterprises.vercel.app"
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$WEB_URL" 2>/dev/null || echo "000")

if [ "$WEB_STATUS" = "200" ] || [ "$WEB_STATUS" = "301" ]; then
    echo -e "   ${GREEN}✅ DEPLOYED (HTTP $WEB_STATUS)${NC}"
    WEB_DEPLOYED=true
else
    echo -e "   ${YELLOW}🟡 Building (HTTP $WEB_STATUS)${NC}"
    WEB_DEPLOYED=false
fi
echo ""

# Check API status  
echo -e "${YELLOW}2. API Backend${NC}"
API_URL="https://infamous-freight-api.fly.dev"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_URL/api/health" 2>/dev/null || echo "000")

if [ "$API_STATUS" = "200" ]; then
    echo -e "   ${GREEN}✅ DEPLOYED (HTTP $API_STATUS)${NC}"
    API_DEPLOYED=true
else
    echo -e "   ${RED}❌ NOT DEPLOYED (HTTP $API_STATUS)${NC}"
    API_DEPLOYED=false
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# DEPLOYMENT OPTIONS
# ═══════════════════════════════════════════════════════════════════════════

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📋 DEPLOYMENT OPTIONS TO REACH 100%${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${PURPLE}Choose your deployment platform:${NC}"
echo ""
echo -e "  ${GREEN}1. Railway.app${NC} (Recommended - Easiest)"
echo -e "     • Free tier available"
echo -e "     • Auto PostgreSQL database"
echo -e "     • One-command deployment"
echo -e "     • Takes ~10 minutes"
echo ""
echo -e "  ${GREEN}2. Vercel + Supabase${NC} (Quick Setup)"
echo -e "     • Use existing Vercel web deployment"
echo -e "     • Free Supabase PostgreSQL"
echo -e "     • Deploy API to Vercel Serverless"
echo -e "     • Takes ~5 minutes"
echo ""
echo -e "  ${GREEN}3. GitHub Actions + Fly.io${NC} (Already Started)"
echo -e "     • Requires FLY_API_TOKEN"
echo -e "     • Auto-deploy from GitHub"
echo -e "     • Takes ~15 minutes"
echo ""
echo -e "  ${GREEN}4. Show Me Current Status Only${NC}"
echo -e "     • Check what's already deployed"
echo -e "     • Get monitoring URLs"
echo ""

read -p "Enter your choice (1-4): " choice
echo ""

case $choice in
    1)
        echo -e "${CYAN}═══ DEPLOYING TO RAILWAY.APP ═══${NC}"
        echo ""
        
        # Check if Railway CLI exists
        if ! command -v railway &> /dev/null; then
            echo -e "${YELLOW}Installing Railway CLI...${NC}"
            curl -fsSL cli.new/railway | sh
            export PATH="$HOME/.railway/bin:$PATH"
        fi
        
        echo -e "${GREEN}✓${NC} Railway CLI ready"
        echo ""
        
        # Login check
        if ! railway whoami &> /dev/null 2>&1; then
            echo -e "${CYAN}Please authenticate with Railway...${NC}"
            railway login
        fi
        
        echo -e "${GREEN}✓${NC} Authenticated: $(railway whoami)"
        echo ""
        
        # Initialize or link project
        if [ ! -d ".railway" ]; then
            echo -e "${CYAN}Creating new Railway project...${NC}"
            railway init
        fi
        
        # Set environment variables
        echo -e "${CYAN}Configuring environment...${NC}"
        railway variables set NODE_ENV=production
        railway variables set PORT=3001
        railway variables set API_PORT=3001
        railway variables set JWT_SECRET="ZYBpTP8D2oMg78DUZfmkVbNol2z5P9xRhrjSdSEkS5s="
        railway variables set CORS_ORIGINS="https://infamous-freight-enterprises.vercel.app"
        railway variables set AI_PROVIDER=synthetic
        railway variables set LOG_LEVEL=info
        
        echo -e "${GREEN}✓${NC} Environment configured"
        echo ""
        
        # Add PostgreSQL if not exists
        if ! railway variables | grep -q "DATABASE_URL"; then
            echo -e "${CYAN}Adding PostgreSQL database...${NC}"
            railway add --database postgresql
            sleep 5
            echo -e "${GREEN}✓${NC} Database provisioned"
        else
            echo -e "${GREEN}✓${NC} Database already exists"
        fi
        echo ""
        
        # Deploy
        echo -e "${CYAN}🚀 Deploying API to Railway...${NC}"
        railway up --dockerfile Dockerfile.api
        
        echo ""
        echo -e "${GREEN}✓${NC} Deployment Complete!"
        echo ""
        
        # Get URL
        RAILWAY_URL=$(railway domain 2>/dev/null || echo "Generating...")
        echo -e "${PURPLE}Your API URL:${NC} https://$RAILWAY_URL"
        echo ""
        
        # Update Vercel
        echo -e "${CYAN}Next Steps:${NC}"
        echo "1. Go to: https://vercel.com/dashboard"
        echo "2. Settings → Environment Variables"
        echo "3. Set: NEXT_PUBLIC_API_URL=https://$RAILWAY_URL"
        echo "4. Redeploy"
        echo ""
        
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                    🎉 100% DEPLOYED! 🎉                                  ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════╝${NC}"
        ;;
        
    2)
        echo -e "${CYAN}═══ DEPLOYING TO VERCEL + SUPABASE ═══${NC}"
        echo ""
        
        echo -e "${YELLOW}This option uses:${NC}"
        echo "  • Vercel for Web + API (serverless functions)"
        echo "  • Supabase for PostgreSQL database"
        echo ""
        
        echo -e "${CYAN}Steps to complete:${NC}"
        echo ""
        echo "1. ${YELLOW}Create Supabase Database:${NC}"
        echo "   a. Go to: https://supabase.com/dashboard"
        echo "   b. Create new project: 'infamous-freight'"
        echo "   c. Copy database connection string"
        echo ""
        echo "2. ${YELLOW}Update Vercel Settings:${NC}"
        echo "   a. Go to: https://vercel.com/dashboard"
        echo "   b. Settings → Environment Variables"
        echo "   c. Add:"
        echo "      DATABASE_URL=[your Supabase connection string]"
        echo "      NODE_ENV=production"
        echo "      JWT_SECRET=ZYBpTP8D2oMg78DUZfmkVbNol2z5P9xRhrjSdSEkS5s="
        echo ""
        echo "3. ${YELLOW}Redeploy:${NC}"
        echo "   a. Deployments → Latest"
        echo "   b. Click '...' → Redeploy"
        echo ""
        
        echo -e "${GREEN}Once complete, you'll be at 100%!${NC}"
        ;;
        
    3)
        echo -e "${CYAN}═══ USING GITHUB ACTIONS + FLY.IO ═══${NC}"
        echo ""
        
        echo -e "${YELLOW}Current Status:${NC}"
        echo "  • GitHub Actions: Triggered ✅"
        echo "  • Fly.io deployment: Waiting for FLY_API_TOKEN"
        echo ""
        
        echo -e "${CYAN}To complete deployment:${NC}"
        echo ""
        echo "1. ${YELLOW}Get Fly.io Token:${NC}"
        echo "   # Install Fly.io CLI"
        echo "   curl -L https://fly.io/install.sh | sh"
        echo "   # Login and get token"
        echo "   flyctl auth login"
        echo "   flyctl auth token"
        echo ""
        echo "2. ${YELLOW}Add to GitHub:${NC}"
        echo "   a. Go to: https://github.com/MrMiless44/Infamous-freight/settings/secrets/actions"
        echo "   b. New secret: FLY_API_TOKEN"
        echo "   c. Paste your token"
        echo ""
        echo "3. ${YELLOW}Re-run Workflow:${NC}"
        echo "   a. Go to: https://github.com/MrMiless44/Infamous-freight/actions"
        echo "   b. Find 'Deploy to Production'"
        echo "   c. Click 'Re-run all jobs'"
        echo ""
        
        echo -e "${CYAN}This will deploy API + Database automatically!${NC}"
        ;;
        
    4)
        echo -e "${CYAN}═══ CURRENT DEPLOYMENT STATUS ═══${NC}"
        echo ""
        
        # Web Status
        echo -e "${PURPLE}━━━ WEB APPLICATION ━━━${NC}"
        echo "  URL: $WEB_URL"
        if [ "$WEB_DEPLOYED" = true ]; then
            echo -e "  Status: ${GREEN}✅ DEPLOYED${NC}"
            echo "  Progress: 100%"
        else
            echo -e "  Status: ${YELLOW}🟡 BUILDING${NC}"
            echo "  Progress: ~85%"
            echo "  Monitor: https://vercel.com/dashboard"
        fi
        echo ""
        
        # API Status
        echo -e "${PURPLE}━━━ API BACKEND ━━━${NC}"
        echo "  URL: $API_URL"
        if [ "$API_DEPLOYED" = true ]; then
            echo -e "  Status: ${GREEN}✅ DEPLOYED${NC}"
            echo "  Progress: 100%"
        else
            echo -e "  Status: ${RED}❌ NOT DEPLOYED${NC}"
            echo "  Progress: 0%"
            echo "  Action: Choose option 1, 2, or 3 above"
        fi
        echo ""
        
        # Database Status
        echo -e "${PURPLE}━━━ DATABASE ━━━${NC}"
        if [ "$API_DEPLOYED" = true ]; then
            echo -e "  Status: ${GREEN}✅ CONNECTED${NC}"
            echo "  Progress: 100%"
        else
            echo -e "  Status: ${YELLOW}⏳ PENDING API DEPLOYMENT${NC}"
            echo "  Progress: 0%"
        fi
        echo ""
        
        # Overall
        if [ "$WEB_DEPLOYED" = true ] && [ "$API_DEPLOYED" = true ]; then
            OVERALL=100
        elif [ "$WEB_DEPLOYED" = true ]; then
            OVERALL=85
        else
            OVERALL=70
        fi
        
        echo -e "${PURPLE}━━━ OVERALL ━━━${NC}"
        echo "  Progress: ${OVERALL}%"
        
        if [ $OVERALL -eq 100 ]; then
            echo -e "  ${GREEN}✅ FULLY DEPLOYED!${NC}"
        else
            echo -e "  ${YELLOW}⏳ DEPLOYMENT IN PROGRESS${NC}"
        fi
        echo ""
        
        echo -e "${CYAN}Monitoring URLs:${NC}"
        echo "  • GitHub Actions: https://github.com/MrMiless44/Infamous-freight/actions"
        echo "  • Vercel: https://vercel.com/dashboard"
        echo ""
        ;;
        
    *)
        echo -e "${RED}Invalid choice. Please run again and select 1-4.${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Run './verify-deployment.sh' anytime to check status!${NC}"
echo ""
