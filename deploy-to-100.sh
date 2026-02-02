#!/bin/bash
# 🎯 INFAMOUS FREIGHT - AUTOMATED 100% DEPLOYMENT
# This script checks if Railway CLI is available and guides deployment

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

clear

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                          ║${NC}"
echo -e "${BLUE}║               🎯 REACH 100% DEPLOYMENT - AUTOMATED 🎯                   ║${NC}"
echo -e "${BLUE}║                                                                          ║${NC}"
echo -e "${BLUE}║          Web App 100% │ API Backend 100% │ Database 100%               ║${NC}"
echo -e "${BLUE}║                                                                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}💡 FASTEST PATH TO 100%: Railway.app Deployment${NC}"
echo ""
echo -e "${YELLOW}This will:${NC}"
echo "  ✓ Deploy your API backend to Railway"
echo "  ✓ Auto-provision PostgreSQL database"
echo "  ✓ Set up SSL and health checks"
echo "  ✓ Get you to 100% in ~10 minutes"
echo ""

# Check if Railway CLI is installed
if command -v railway &> /dev/null; then
    echo -e "${GREEN}✓ Railway CLI is installed${NC}"
    HAS_RAILWAY=true
else
    echo -e "${YELLOW}⚠ Railway CLI not found${NC}"
    HAS_RAILWAY=false
fi
echo ""

# Check if logged in
if [ "$HAS_RAILWAY" = true ]; then
    if railway whoami &> /dev/null 2>&1; then
        echo -e "${GREEN}✓ Already logged into Railway as: $(railway whoami)${NC}"
        IS_LOGGED_IN=true
    else
        echo -e "${YELLOW}⚠ Not logged into Railway${NC}"
        IS_LOGGED_IN=false
    fi
else
    IS_LOGGED_IN=false
fi
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📋 DEPLOYMENT OPTIONS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$HAS_RAILWAY" = true ] && [ "$IS_LOGGED_IN" = true ]; then
    # Ready to deploy immediately
    echo -e "${GREEN}🚀 YOU'RE READY TO DEPLOY!${NC}"
    echo ""
    echo "Everything is configured. Deploy now?"
    echo ""
    read -p "Deploy to Railway now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${CYAN}🚀 Deploying to Railway...${NC}"
        echo ""
        
        # Set environment variables
        echo "Setting environment variables..."
        railway variables set NODE_ENV=production
        railway variables set PORT=3001
        railway variables set API_PORT=3001
        railway variables set JWT_SECRET="ZYBpTP8D2oMg78DUZfmkVbNol2z5P9xRhrjSdSEkS5s="
        railway variables set CORS_ORIGINS="https://infamous-freight-enterprises.vercel.app"
        railway variables set AI_PROVIDER=synthetic
        railway variables set LOG_LEVEL=info
        
        # Add database if needed
        if ! railway variables | grep -q "DATABASE_URL"; then
            echo "Adding PostgreSQL database..."
            railway add --database postgresql
            sleep 5
        fi
        
        # Deploy
        echo ""
        echo -e "${CYAN}Building and deploying...${NC}"
        railway up --dockerfile Dockerfile.api
        
        echo ""
        echo -e "${GREEN}✓ Deployment initiated!${NC}"
        echo ""
        
        # Get URL
        sleep 5
        RAILWAY_URL=$(railway domain 2>/dev/null || echo "")
        
        if [ -n "$RAILWAY_URL" ]; then
            echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║                      🎉 DEPLOYMENT SUCCESSFUL! 🎉                       ║${NC}"
            echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════╝${NC}"
            echo ""
            echo -e "${CYAN}Your API URL:${NC} https://$RAILWAY_URL"
            echo ""
            echo -e "${YELLOW}📝 Final Steps:${NC}"
            echo "1. Go to: https://vercel.com/dashboard"
            echo "2. Settings → Environment Variables"
            echo "3. Add: NEXT_PUBLIC_API_URL=https://$RAILWAY_URL"
            echo "4. Redeploy Vercel"
            echo ""
            echo -e "${GREEN}Then you'll be at 100%! 🎊${NC}"
        else
            echo "Deployment started! Check Railway dashboard for URL."
            echo "Dashboard: https://railway.app/dashboard"
        fi
    else
        echo ""
        echo "No problem! Deploy whenever you're ready:"
        echo "  ./deploy-railway-api.sh"
    fi
    
elif [ "$HAS CLI" = true ] && [ "$IS_LOGGED_IN" = false ]; then
    # Has CLI but needs to login
    echo -e "${YELLOW}⚠ Railway CLI found but not logged in${NC}"
    echo ""
    echo "Steps to deploy:"
    echo "  1. Login: railway login"
    echo "  2. Run this script again"
    echo ""
    read -p "Login now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway login
        echo ""
        echo -e "${GREEN}✓ Logged in! Run this script again to deploy.${NC}"
    fi
    
else
    # No CLI - give options
    echo -e "${CYAN}Choose your deployment method:${NC}"
    echo ""
    echo -e "  ${GREEN}A. Install Railway CLI (Recommended)${NC}"
    echo "     • Fastest path to 100%"
    echo "     • One command deployment"
    echo "     • Auto database setup"
    echo ""
    echo -e "  ${GREEN}B. Use Vercel + Supabase${NC}"
    echo "     • No CLI needed"
    echo "     • Use web dashboards"
    echo "     • Manual setup (5 min)"
    echo ""
    echo -e "  ${GREEN}C. Use GitHub Actions${NC}"
    echo "     • Already configured"
    echo "     • Need Fly.io token"
    echo ""
    read -p "Enter choice (A/B/C): " -n 1 -r
    echo ""
    echo ""
    
    case $REPLY in
        [Aa])
            echo -e "${CYAN}Installing Railway CLI...${NC}"
            echo ""
            
            if curl -fsSL cli.new/railway | sh; then
                export PATH="$HOME/.railway/bin:$PATH"
                echo ""
                echo -e "${GREEN}✓ Railway CLI installed!${NC}"
                echo ""
                echo "Now login and deploy:"
                echo "  1. railway login"
                echo "  2. Run this script again"
                echo ""
                read -p "Login now? (y/n): " -n 1 -r
                echo ""
                
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    railway login
                    echo ""
                    echo -e "${GREEN}✓ Ready to deploy! Run this script again.${NC}"
                fi
            else
                echo -e "${RED}Installation failed. Try manual install:${NC}"
                echo "  curl -fsSL cli.new/railway | sh"
            fi
            ;;
            
        [Bb])
            echo -e "${CYAN}═══ VERCEL + SUPABASE DEPLOYMENT ═══${NC}"
            echo ""
            echo "Steps:"
            echo ""
            echo "1. ${YELLOW}Create Supabase Database:${NC}"
            echo "   • Go to: https://supabase.com/dashboard"
            echo "   • Click 'New Project'"
            echo "   • Name: infamous-freight"
            echo "   • Copy connection string"
            echo ""
            echo "2. ${YELLOW}Update Vercel:${NC}"
            echo "   • Go to: https://vercel.com/dashboard"
            echo "   • Settings → Environment Variables"
            echo "   • Add DATABASE_URL with connection string"
            echo "   • Add JWT_SECRET=ZYBpTP8D2oMg78DUZfmkVbNol2z5P9xRhrjSdSEkS5s="
            echo "   • Redeploy"
            echo ""
            echo "3. ${YELLOW}Verify:${NC}"
            echo "   • Check deployment status"
            echo "   • Run: ./verify-deployment.sh"
            echo ""
            ;;
            
        [Cc])
            echo -e "${CYAN}═══ GITHUB ACTIONS DEPLOYMENT ═══${NC}"
            echo ""
            echo "Steps:"
            echo ""
            echo "1. ${YELLOW}Get Fly.io Token:${NC}"
            echo "   • Install: curl -L https://fly.io/install.sh | sh"
            echo "   • Login: flyctl auth login"
            echo "   • Get token: flyctl auth token"
            echo ""
            echo "2. ${YELLOW}Add to GitHub:${NC}"
            echo "   • Go to: https://github.com/MrMiless44/Infamous-freight/settings/secrets/actions"
            echo "   • New secret: FLY_API_TOKEN"
            echo "   • Paste token"
            echo ""
            echo "3. ${YELLOW}Re-run Workflow:${NC}"
            echo "   • Go to: https://github.com/MrMiless44/Infamous-freight/actions"
            echo "   • Click 'Re-run all jobs'"
            echo ""
            ;;
            
        *)
            echo "Invalid choice. Run again and select A, B, or C."
            ;;
    esac
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📚 Documentation:${NC}"
echo "  • PATH_TO_100_PERCENT.md - Detailed guide"
echo "  • DEPLOYMENT_SUCCESS.md - Full status"
echo "  • verify-deployment.sh - Check status anytime"
echo ""
echo -e "${CYAN}🔍 Monitor Progress:${NC}"
echo "  • GitHub Actions: https://github.com/MrMiless44/Infamous-freight/actions"
echo "  • Vercel Dashboard: https://vercel.com/dashboard"
echo ""
