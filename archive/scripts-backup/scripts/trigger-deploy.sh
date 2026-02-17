#!/bin/bash
# Trigger Multi-Platform Deployment Workflow
# Manually triggers the deploy-all workflow

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Multi-Platform Deployment Trigger${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}✗ GitHub CLI (gh) is not installed${NC}"
    echo -e "${YELLOW}Install it from: https://cli.github.com/${NC}"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}✗ Not authenticated with GitHub CLI${NC}"
    echo -e "${YELLOW}Run: gh auth login${NC}"
    exit 1
fi

echo -e "${GREEN}✓ GitHub CLI authenticated${NC}"
echo ""

# Validate secrets first
echo -e "${BLUE}Step 1: Validating secrets configuration...${NC}"
if ! ./scripts/validate-secrets.sh; then
    echo ""
    echo -e "${RED}✗ Secrets validation failed${NC}"
    echo -e "${YELLOW}Please configure missing secrets before deploying${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Confirming deployment...${NC}"
echo ""
echo -e "${YELLOW}This will deploy to:${NC}"
echo "  • Fly.io (API)"
echo "  • Vercel (Web)"
echo "  • Railway (Database migrations)"
echo "  • Supabase (Edge functions + DB migrations)"
echo ""
read -p "Continue with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Step 3: Triggering workflow...${NC}"

# Trigger the workflow
WORKFLOW_RUN=$(gh workflow run deploy-all.yml --ref main 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Workflow triggered successfully!${NC}"
    echo ""
    
    # Wait a moment for the workflow to start
    echo -e "${BLUE}Fetching workflow run details...${NC}"
    sleep 3
    
    # Get the latest workflow run
    RUN_ID=$(gh run list --workflow=deploy-all.yml --limit 1 --json databaseId --jq '.[0].databaseId')
    
    if [ -n "$RUN_ID" ]; then
        REPO_FULL=$(gh repo view --json nameWithOwner -q .nameWithOwner)
        RUN_URL="https://github.com/${REPO_FULL}/actions/runs/${RUN_ID}"
        
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}   Deployment Started!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${BLUE}Workflow Run:${NC} ${RUN_URL}"
        echo ""
        echo -e "${BLUE}Watch live:${NC}"
        echo "  ${YELLOW}gh run watch${NC}"
        echo ""
        echo -e "${BLUE}View logs:${NC}"
        echo "  ${YELLOW}gh run view ${RUN_ID} --log${NC}"
        echo ""
        echo -e "${BLUE}Platform Dashboards:${NC}"
        echo "  • Fly.io:     https://fly.io/dashboard"
        echo "  • Vercel:     https://vercel.com/dashboard"
        echo "  • Railway:    https://railway.app/"
        echo "  • Supabase:   https://supabase.com/dashboard"
        echo ""
        
        # Ask if user wants to watch
        read -p "Watch workflow progress now? (yes/no): " WATCH
        
        if [ "$WATCH" == "yes" ]; then
            echo ""
            gh run watch "${RUN_ID}"
        fi
    else
        echo -e "${YELLOW}⚠ Could not fetch run details, but workflow was triggered${NC}"
        echo -e "${BLUE}Check status:${NC} gh run list --workflow=deploy-all.yml"
    fi
else
    echo -e "${RED}✗ Failed to trigger workflow${NC}"
    echo -e "${YELLOW}Error: ${WORKFLOW_RUN}${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  1. Check workflow file exists: .github/workflows/deploy-all.yml"
    echo "  2. Verify repository permissions"
    echo "  3. Check workflow syntax: gh workflow view deploy-all.yml"
    exit 1
fi
