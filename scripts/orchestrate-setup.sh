#!/bin/bash
# Complete Setup Orchestrator
# Guides user through entire production setup

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🚀 Complete Production Setup Orchestrator              ║"
echo "║   Infamous Freight Enterprises                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Menu
show_menu() {
    echo ""
    echo -e "${BLUE}What would you like to do?${NC}"
    echo ""
    echo "  IMMEDIATE (Required - 30 minutes):"
    echo "    1) Setup GitHub Secrets (FLY_API_TOKEN)"
    echo "    2) Create Fly.io Apps (API + Database)"
    echo ""
    echo "  SHORT-TERM (Recommended - 1 hour):"
    echo "    3) Setup Monitoring Services (Sentry, Datadog, etc)"
    echo "    4) Add AI Provider & External Keys"
    echo ""
    echo "  OPTIONAL (Nice to have - 2 hours):"
    echo "    5) Optimize Costs (FREE tier setup)"
    echo ""
    echo "  AUTOMATED:"
    echo "    6) Run ALL steps (interactive)"
    echo "    7) Run all QUICK setups (API + GitHub + Monitoring)"
    echo ""
    echo "  VERIFICATION:"
    echo "    8) Test Current Deployment"
    echo "    9) View Status & Logs"
    echo ""
    echo "  EXIT:"
    echo "    0) Exit"
    echo ""
    read -p "Enter your choice (0-9): " choice
}

# Step 1: GitHub Secrets
step_github_secrets() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}STEP 1: GitHub Secrets Setup${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    bash scripts/setup-github-secrets.sh
}

# Step 2: Create Fly.io Apps
step_create_fly_apps() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}STEP 2: Create Fly.io Apps${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    bash scripts/create-fly-apps.sh
}

# Step 3: Monitoring
step_monitoring() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}STEP 3: Setup Monitoring Services${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    bash scripts/setup-monitoring-services.sh
}

# Step 4: External Keys
step_external_keys() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}STEP 4: Configure External Service Keys${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    
    echo "Setting up optional external service keys..."
    echo ""
    
    # OpenAI
    echo "1️⃣  OpenAI API (Optional)"
    read -p "   Set OpenAI API key? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "   Paste OpenAI key (sk-...): " openai_key
        if [ ! -z "$openai_key" ]; then
            flyctl secrets set OPENAI_API_KEY="$openai_key" --app infamous-freight-api
            echo "   ✅ OpenAI configured"
        fi
    fi
    echo ""
    
    # Anthropic
    echo "2️⃣  Anthropic API (Optional)"
    read -p "   Set Anthropic API key? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "   Paste Anthropic key (sk-ant-...): " anthropic_key
        if [ ! -z "$anthropic_key" ]; then
            flyctl secrets set ANTHROPIC_API_KEY="$anthropic_key" --app infamous-freight-api
            echo "   ✅ Anthropic configured"
        fi
    fi
    echo ""
    
    # Stripe
    echo "3️⃣  Stripe (Optional - for billing)"
    read -p "   Set Stripe key? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "   Paste Stripe secret key (sk_live_...): " stripe_key
        if [ ! -z "$stripe_key" ]; then
            flyctl secrets set STRIPE_SECRET_KEY="$stripe_key" --app infamous-freight-api
            echo "   ✅ Stripe configured"
        fi
    fi
    echo ""
    
    # PayPal
    echo "4️⃣  PayPal (Optional - for billing)"
    read -p "   Set PayPal credentials? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "   Paste PayPal Client ID: " paypal_id
        read -p "   Paste PayPal Client Secret: " paypal_secret
        if [ ! -z "$paypal_id" ] && [ ! -z "$paypal_secret" ]; then
            flyctl secrets set \
                PAYPAL_CLIENT_ID="$paypal_id" \
                PAYPAL_CLIENT_SECRET="$paypal_secret" \
                --app infamous-freight-api
            echo "   ✅ PayPal configured"
        fi
    fi
    echo ""
}

# Step 5: Cost Optimization
step_optimize_costs() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}STEP 5: Cost Optimization${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    bash scripts/optimize-costs.sh
}

# Test Deployment
step_test_deployment() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}Testing Deployment${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    
    echo "Testing Web Frontend..."
    WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://infamous-freight-enterprises.fly.dev/)
    echo "   Web Status: $WEB_STATUS"
    
    echo ""
    echo "Testing API Health..."
    API_HEALTH=$(curl -s https://infamous-freight-api.fly.dev/api/health)
    echo "   API Response: $(echo $API_HEALTH | head -c 100)..."
    
    echo ""
    echo "Testing Swagger Docs..."
    DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://infamous-freight-api.fly.dev/api/docs)
    echo "   Docs Status: $DOCS_STATUS"
    
    echo ""
}

# View Status
step_view_status() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}Current Deployment Status${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    
    echo "Web Application:"
    flyctl status --app infamous-freight-enterprises || echo "Not deployed or error"
    echo ""
    
    echo "API Application:"
    flyctl status --app infamous-freight-api || echo "Not deployed or error"
    echo ""
    
    echo "Recent API Logs:"
    flyctl logs --app infamous-freight-api --tail 20 || echo "Could not fetch logs"
    echo ""
}

# Run ALL
run_all() {
    echo ""
    echo -e "${YELLOW}Running complete setup...${NC}"
    echo ""
    
    step_github_secrets
    echo ""
    read -p "GitHub secrets done. Continue? (y/n) " -n 1 -r
    echo
    
    step_create_fly_apps
    echo ""
    read -p "Fly.io apps done. Continue? (y/n) " -n 1 -r
    echo
    
    step_monitoring
    echo ""
    read -p "Monitoring done. Continue? (y/n) " -n 1 -r
    echo
    
    step_external_keys
    echo ""
    read -p "External keys done. Continue? (y/n) " -n 1 -r
    echo
    
    step_optimize_costs
    echo ""
    
    echo -e "${GREEN}✅ Complete setup finished!${NC}"
}

# Quick Setup
run_quick() {
    echo ""
    echo -e "${YELLOW}Running quick setup (API + GitHub + Monitoring)...${NC}"
    echo ""
    
    step_github_secrets
    echo ""
    step_create_fly_apps
    echo ""
    step_monitoring
    echo ""
    
    echo -e "${GREEN}✅ Quick setup finished!${NC}"
}

# Main Loop
while true; do
    show_menu
    
    case $choice in
        1) step_github_secrets ;;
        2) step_create_fly_apps ;;
        3) step_monitoring ;;
        4) step_external_keys ;;
        5) step_optimize_costs ;;
        6) run_all ;;
        7) run_quick ;;
        8) step_test_deployment ;;
        9) step_view_status ;;
        0) 
            echo ""
            echo -e "${GREEN}✅ Setup orchestrator exiting${NC}"
            echo ""
            echo "Quick reference:"
            echo "  ./scripts/setup-github-secrets.sh - Add secrets to GitHub"
            echo "  ./scripts/create-fly-apps.sh - Create API and database"
            echo "  ./scripts/setup-monitoring-services.sh - Setup monitoring"
            echo "  ./scripts/optimize-costs.sh - Use free tier services"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
done
