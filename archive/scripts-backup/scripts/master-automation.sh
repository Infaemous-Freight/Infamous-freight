#!/bin/bash
set -e

# 🎯 MASTER AUTOMATION - ONE COMMAND TO RULE THEM ALL
# Infæmous Freight Enterprises Production Automation

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║           🎯 MASTER PRODUCTION AUTOMATION 🎯                  ║"
echo "║                                                                ║"
echo "║  Complete production deployment and management automation     ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='' \033[1;33m'
NC='\033[0;33m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_menu() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "    MASTER AUTOMATION MENU"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  🚀 DEPLOYMENT"
    echo "     [1] One-Click Production Deploy"
    echo "     [2] Deploy to Staging"
    echo "     [3] Rollback Production"
    echo ""
    echo "  🧪 TESTING & VERIFICATION"
    echo "     [4] Run Smoke Tests"
    echo "     [5] Run Full Test Suite"
    echo "     [6] Verify Enterprise Grade"
    echo ""
    echo "  📊 MONITORING & HEALTH"
    echo "     [7] Monitor Production (Real-time)"
    echo "     [8] Health Check"
    echo "     [9] View Logs (Fly.io)"
    echo "     [10] View Logs (Vercel)"
    echo ""
    echo "  🔧 DEVELOPMENT"
    echo "     [11] Start Dev Environment"
    echo "     [12] Build All Packages"
    echo "     [13] Run Linting"
    echo ""
    echo "  🔒 SECURITY & MAINTENANCE"
    echo "     [14] Security Audit"
    echo "     [15] Rotate Secrets"
    echo "     [16] Backup Database"
    echo ""
    echo "  📖 DOCUMENTATION & HELP"
    echo "     [17] View Deployment Guide"
    echo "     [18] Show Quick Reference"
    echo "     [19] List All Scripts"
    echo ""
    echo "  [0] Exit"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

while true; do
    clear
    print_menu
    read -p "Select option: " choice
    echo ""
    
    case $choice in
        1)
            echo -e "${BLUE}🚀 Starting production deployment...${NC}"
            bash "$SCRIPT_DIR/deploy-production.sh"
            ;;
        2)
            echo -e "${BLUE}🚀 Deploying to staging...${NC}"
            echo "Staging deployment requires environment setup"
            read -p "Continue? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                bash "$SCRIPT_DIR/deploy-complete.sh"
            fi
            ;;
        3)
            echo -e "${YELLOW}🔄 Rolling back production...${NC}"
            bash "$SCRIPT_DIR/rollback.sh"
            ;;
        4)
            echo -e "${BLUE}🧪 Running smoke tests...${NC}"
            bash "$SCRIPT_DIR/smoke-test.sh"
            ;;
        5)
            echo -e "${BLUE}🧪 Running full test suite...${NC}"
            cd "$(dirname "$SCRIPT_DIR")"
            pnpm test
            ;;
        6)
            echo -e "${BLUE}✅ Verifying enterprise grade...${NC}"
            bash "$SCRIPT_DIR/verify-enterprise.sh"
            ;;
        7)
            echo -e "${BLUE}📊 Starting production monitor...${NC}"
            bash "$SCRIPT_DIR/monitor-production.sh"
            ;;
        8)
            echo -e "${BLUE}🏥 Running health check...${NC}"
            bash "$SCRIPT_DIR/health-monitor.sh"
            ;;
        9)
            echo -e "${BLUE}📋 Viewing Fly.io logs...${NC}"
            flyctl logs --follow
            ;;
        10)
            echo -e "${BLUE}📋 Opening Vercel dashboard...${NC}"
            echo "Visit: https://vercel.com/dashboard"
            xdg-open "https://vercel.com/dashboard" 2>/dev/null || true
            ;;
        11)
            echo -e "${BLUE}💻 Starting dev environment...${NC}"
            cd "$(dirname "$SCRIPT_DIR")"
            pnpm dev
            ;;
        12)
            echo -e "${BLUE}🔨 Building all packages...${NC}"
            cd "$(dirname "$SCRIPT_DIR")"
            pnpm build
            ;;
        13)
            echo -e "${BLUE}🧹 Running linter...${NC}"
            cd "$(dirname "$SCRIPT_DIR")"
            pnpm lint
            ;;
        14)
            echo -e "${BLUE}🔒 Running security audit...${NC}"
            bash "$SCRIPT_DIR/security-scan.sh"
            ;;
        15)
            echo -e "${BLUE}🔑 Rotating secrets...${NC}"
            bash "$SCRIPT_DIR/rotate-secrets.sh"
            ;;
        16)
            echo -e "${BLUE}💾 Backing up database...${NC}"
            bash "$SCRIPT_DIR/backup.sh"
            ;;
        17)
            echo -e "${BLUE}📖 Opening deployment guide...${NC}"
            less "$(dirname "$SCRIPT_DIR")/DEPLOYMENT_100_COMPLETE.md"
            ;;
        18)
            echo -e "${BLUE}📝 Quick reference...${NC}"
            cat << 'EOF'

╔════════════════════════════════════════════════════════════════╗
║              QUICK REFERENCE - COMMON COMMANDS                ║
╚════════════════════════════════════════════════════════════════╝

DEPLOYMENT:
  Deploy Production:  ./scripts/deploy-production.sh
  Rollback:           ./scripts/rollback.sh
  Smoke Tests:        ./scripts/smoke-test.sh

DEVELOPMENT:
  Start Dev:          pnpm dev
  Build All:          pnpm build
  Run Tests:          pnpm test
  Lint:               pnpm lint

MONITORING:
  Monitor Production: ./scripts/monitor-production.sh
  Health Check:       ./scripts/health-monitor.sh
  API Logs:           flyctl logs --follow

FLY.IO COMMANDS:
  Deploy:             flyctl deploy
  Status:             flyctl status
  Logs:               flyctl logs --follow
  SSH:                flyctl ssh console
  Scale:              flyctl scale count 2

VERCEL COMMANDS:
  Deploy:             git push origin main
  Dashboard:          https://vercel.com/dashboard

PRODUCTION URLS:
  Web:                https://infamous-freight.vercel.app
  API:                https://infamous-freight-api.fly.dev
  Health:             https://infamous-freight-api.fly.dev/api/health

EOF
            ;;
        19)
            echo -e "${BLUE}📋 Listing all automation scripts...${NC}"
            ls -1 "$SCRIPT_DIR"/*.sh | xargs -I {} basename {}
            ;;
        0)
            echo -e "${GREEN}👋 Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${YELLOW}Invalid option. Please try again.${NC}"
            sleep 2
            ;;
    esac
    
    echo ""
    read -p "Press Enter to return to menu..."
done
