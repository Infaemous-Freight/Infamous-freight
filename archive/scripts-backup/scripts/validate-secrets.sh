#!/bin/bash
# Validate GitHub Actions Secrets Configuration
# Checks if all required secrets are set for multi-platform deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Multi-Platform Deployment Secrets Validation${NC}"
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

# Required secrets for multi-platform deployment
REQUIRED_SECRETS=(
    "FLY_API_TOKEN:Fly.io API deployment"
    "VERCEL_TOKEN:Vercel web deployment"
    "VERCEL_ORG_ID:Vercel organization"
    "VERCEL_PROJECT_ID:Vercel project"
    "RAILWAY_TOKEN:Railway database migrations"
    "RAILWAY_PROJECT_ID:Railway project"
    "SUPABASE_ACCESS_TOKEN:Supabase deployment"
    "SUPABASE_PROJECT_REF:Supabase project reference"
    "SUPABASE_DB_PASSWORD:Supabase database"
    "DATABASE_URL:Production database connection"
    "JWT_SECRET:JWT token signing"
)

# Optional but recommended secrets
OPTIONAL_SECRETS=(
    "GHCR_TOKEN:GitHub Container Registry"
    "SLACK_WEBHOOK_URL:Slack deployment notifications"
    "DISCORD_WEBHOOK_URL:Discord deployment notifications"
    "SENTRY_AUTH_TOKEN:Error tracking"
    "STRIPE_SECRET_KEY:Payment processing"
    "SENDGRID_API_KEY:Email service"
)

# Get list of configured secrets
echo -e "${BLUE}Checking configured secrets...${NC}"
CONFIGURED_SECRETS=$(gh secret list --json name --jq '.[].name' 2>/dev/null || echo "")

if [ -z "$CONFIGURED_SECRETS" ]; then
    echo -e "${RED}✗ Unable to list secrets. Check repository access permissions.${NC}"
    exit 1
fi

# Validate required secrets
echo ""
echo -e "${BLUE}Required Secrets (11):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MISSING_COUNT=0
FOUND_COUNT=0

for secret_info in "${REQUIRED_SECRETS[@]}"; do
    SECRET_NAME="${secret_info%%:*}"
    SECRET_DESC="${secret_info##*:}"
    
    if echo "$CONFIGURED_SECRETS" | grep -q "^${SECRET_NAME}$"; then
        echo -e "${GREEN}✓ ${SECRET_NAME}${NC} - ${SECRET_DESC}"
        ((FOUND_COUNT++))
    else
        echo -e "${RED}✗ ${SECRET_NAME}${NC} - ${SECRET_DESC} ${YELLOW}(MISSING)${NC}"
        ((MISSING_COUNT++))
    fi
done

echo ""
echo -e "${BLUE}Optional Secrets (6):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

OPTIONAL_FOUND=0
for secret_info in "${OPTIONAL_SECRETS[@]}"; do
    SECRET_NAME="${secret_info%%:*}"
    SECRET_DESC="${secret_info##*:}"
    
    if echo "$CONFIGURED_SECRETS" | grep -q "^${SECRET_NAME}$"; then
        echo -e "${GREEN}✓ ${SECRET_NAME}${NC} - ${SECRET_DESC}"
        ((OPTIONAL_FOUND++))
    else
        echo -e "${YELLOW}○ ${SECRET_NAME}${NC} - ${SECRET_DESC} (recommended)"
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Summary
if [ $MISSING_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All required secrets are configured! (${FOUND_COUNT}/${#REQUIRED_SECRETS[@]})${NC}"
    echo -e "${GREEN}✓ Optional secrets configured: ${OPTIONAL_FOUND}/${#OPTIONAL_SECRETS[@]}${NC}"
    echo ""
    echo -e "${GREEN}🚀 Ready to deploy!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Trigger manual deployment:"
    echo "     ${YELLOW}./scripts/trigger-deploy.sh${NC}"
    echo ""
    echo "  2. Or push to main branch:"
    echo "     ${YELLOW}git push origin main${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Missing ${MISSING_COUNT} required secret(s)${NC}"
    echo ""
    echo -e "${YELLOW}To add secrets:${NC}"
    echo "  1. Go to: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/settings/secrets/actions"
    echo "  2. Click 'New repository secret'"
    echo "  3. Add each missing secret"
    echo ""
    echo -e "${YELLOW}Or use GitHub CLI:${NC}"
    echo "  ${BLUE}gh secret set SECRET_NAME${NC}"
    echo ""
    echo -e "${YELLOW}For detailed instructions, see:${NC}"
    echo "  ${BLUE}GITHUB_ACTIONS_SECRETS_SETUP.md${NC}"
    echo ""
    exit 1
fi
