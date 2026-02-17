#!/bin/bash
# Setup Deployment Notifications (Slack & Discord)
# Interactive script to configure webhook URLs for deployment notifications

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Deployment Notifications Setup${NC}"
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

# Display current status
echo -e "${CYAN}${BOLD}Current Notification Status:${NC}"
echo ""

CONFIGURED_SECRETS=$(gh secret list --json name --jq '.[].name' 2>/dev/null || echo "")

SLACK_CONFIGURED=false
DISCORD_CONFIGURED=false

if echo "$CONFIGURED_SECRETS" | grep -q "^SLACK_WEBHOOK_URL$"; then
    echo -e "${GREEN}✓ Slack webhook configured${NC}"
    SLACK_CONFIGURED=true
else
    echo -e "${YELLOW}○ Slack webhook not configured${NC}"
fi

if echo "$CONFIGURED_SECRETS" | grep -q "^DISCORD_WEBHOOK_URL$"; then
    echo -e "${GREEN}✓ Discord webhook configured${NC}"
    DISCORD_CONFIGURED=true
else
    echo -e "${YELLOW}○ Discord webhook not configured${NC}"
fi

echo ""
echo -e "${CYAN}${BOLD}What would you like to do?${NC}"
echo ""
echo "  1) Setup Slack notifications"
echo "  2) Setup Discord notifications"
echo "  3) Setup both Slack and Discord"
echo "  4) Remove notification webhooks"
echo "  5) View setup instructions"
echo "  6) Exit"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo -e "${CYAN}${BOLD}Slack Webhook Setup${NC}"
        echo -e "${BLUE}Follow these steps:${NC}"
        echo ""
        echo "1. Go to: https://api.slack.com/apps"
        echo "2. Click 'Create New App' → 'From scratch'"
        echo "3. Name: 'Deployment Notifier', select your workspace"
        echo "4. Go to 'Features' → 'Incoming Webhooks' → Activate"
        echo "5. Click 'Add New Webhook to Workspace'"
        echo "6. Select a channel (e.g., #deployments)"
        echo "7. Copy the webhook URL"
        echo ""
        read -p "Enter your Slack webhook URL: " SLACK_WEBHOOK
        
        if [ -z "$SLACK_WEBHOOK" ]; then
            echo -e "${RED}✗ No webhook URL provided${NC}"
            exit 1
        fi
        
        if [[ ! "$SLACK_WEBHOOK" =~ ^https://hooks.slack.com/services/ ]]; then
            echo -e "${YELLOW}⚠ Warning: This doesn't look like a Slack webhook URL${NC}"
            read -p "Continue anyway? (y/N): " confirm
            if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
                echo -e "${RED}Cancelled${NC}"
                exit 1
            fi
        fi
        
        echo "$SLACK_WEBHOOK" | gh secret set SLACK_WEBHOOK_URL
        echo ""
        echo -e "${GREEN}✓ Slack webhook configured successfully!${NC}"
        echo -e "${CYAN}Slack notifications will be sent on every deployment${NC}"
        ;;
        
    2)
        echo ""
        echo -e "${CYAN}${BOLD}Discord Webhook Setup${NC}"
        echo -e "${BLUE}Follow these steps:${NC}"
        echo ""
        echo "1. Go to your Discord server"
        echo "2. Click Server Settings (gear icon)"
        echo "3. Go to 'Integrations' → 'Webhooks'"
        echo "4. Click 'New Webhook' or 'Create Webhook'"
        echo "5. Set name: 'Deployment Notifier'"
        echo "6. Select a channel (e.g., #deployments)"
        echo "7. Click 'Copy Webhook URL'"
        echo ""
        read -p "Enter your Discord webhook URL: " DISCORD_WEBHOOK
        
        if [ -z "$DISCORD_WEBHOOK" ]; then
            echo -e "${RED}✗ No webhook URL provided${NC}"
            exit 1
        fi
        
        if [[ ! "$DISCORD_WEBHOOK" =~ ^https://discord.com/api/webhooks/ ]]; then
            echo -e "${YELLOW}⚠ Warning: This doesn't look like a Discord webhook URL${NC}"
            read -p "Continue anyway? (y/N): " confirm
            if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
                echo -e "${RED}Cancelled${NC}"
                exit 1
            fi
        fi
        
        echo "$DISCORD_WEBHOOK" | gh secret set DISCORD_WEBHOOK_URL
        echo ""
        echo -e "${GREEN}✓ Discord webhook configured successfully!${NC}"
        echo -e "${CYAN}Discord notifications will be sent on every deployment${NC}"
        ;;
        
    3)
        # Setup both
        echo ""
        echo -e "${CYAN}${BOLD}=== Slack Webhook Setup ===${NC}"
        echo ""
        echo "1. Go to: https://api.slack.com/apps"
        echo "2. Create New App → From scratch"
        echo "3. Name: 'Deployment Notifier', select workspace"
        echo "4. Features → Incoming Webhooks → Activate"
        echo "5. Add New Webhook to Workspace → Select channel"
        echo ""
        read -p "Enter Slack webhook URL: " SLACK_WEBHOOK
        
        if [ -n "$SLACK_WEBHOOK" ]; then
            echo "$SLACK_WEBHOOK" | gh secret set SLACK_WEBHOOK_URL
            echo -e "${GREEN}✓ Slack configured${NC}"
        else
            echo -e "${YELLOW}⊘ Skipped Slack${NC}"
        fi
        
        echo ""
        echo -e "${CYAN}${BOLD}=== Discord Webhook Setup ===${NC}"
        echo ""
        echo "1. Server Settings → Integrations → Webhooks"
        echo "2. Create Webhook"
        echo "3. Name: 'Deployment Notifier', select channel"
        echo "4. Copy Webhook URL"
        echo ""
        read -p "Enter Discord webhook URL: " DISCORD_WEBHOOK
        
        if [ -n "$DISCORD_WEBHOOK" ]; then
            echo "$DISCORD_WEBHOOK" | gh secret set DISCORD_WEBHOOK_URL
            echo -e "${GREEN}✓ Discord configured${NC}"
        else
            echo -e "${YELLOW}⊘ Skipped Discord${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}✓ Notification setup complete!${NC}"
        ;;
        
    4)
        echo ""
        echo -e "${YELLOW}Remove notification webhooks:${NC}"
        echo ""
        if [ "$SLACK_CONFIGURED" = true ]; then
            read -p "Remove Slack webhook? (y/N): " remove_slack
            if [[ "$remove_slack" =~ ^[Yy]$ ]]; then
                gh secret delete SLACK_WEBHOOK_URL
                echo -e "${GREEN}✓ Slack webhook removed${NC}"
            fi
        fi
        
        if [ "$DISCORD_CONFIGURED" = true ]; then
            read -p "Remove Discord webhook? (y/N): " remove_discord
            if [[ "$remove_discord" =~ ^[Yy]$ ]]; then
                gh secret delete DISCORD_WEBHOOK_URL
                echo -e "${GREEN}✓ Discord webhook removed${NC}"
            fi
        fi
        
        if [ "$SLACK_CONFIGURED" = false ] && [ "$DISCORD_CONFIGURED" = false ]; then
            echo -e "${YELLOW}No webhooks configured to remove${NC}"
        fi
        ;;
        
    5)
        echo ""
        echo -e "${CYAN}${BOLD}═══ Setup Instructions ═══${NC}"
        echo ""
        echo -e "${BLUE}Slack Webhook:${NC}"
        echo "  1. Visit: https://api.slack.com/apps"
        echo "  2. Create New App → From scratch"
        echo "  3. Name: 'Deployment Notifier'"
        echo "  4. Select your workspace"
        echo "  5. Go to Features → Incoming Webhooks"
        echo "  6. Activate Incoming Webhooks"
        echo "  7. Click 'Add New Webhook to Workspace'"
        echo "  8. Select a channel (e.g., #deployments)"
        echo "  9. Copy the webhook URL"
        echo "  10. Run this script again and paste the URL"
        echo ""
        echo -e "${BLUE}Discord Webhook:${NC}"
        echo "  1. Open your Discord server"
        echo "  2. Click Server Settings (gear icon near server name)"
        echo "  3. Go to Integrations → Webhooks"
        echo "  4. Click 'New Webhook' or 'Create Webhook'"
        echo "  5. Set name: 'Deployment Notifier'"
        echo "  6. Select a channel (e.g., #deployments)"
        echo "  7. Customize avatar (optional)"
        echo "  8. Click 'Copy Webhook URL'"
        echo "  9. Run this script again and paste the URL"
        echo ""
        echo -e "${CYAN}What notifications include:${NC}"
        echo "  • Overall deployment status (success/failure)"
        echo "  • Per-platform status (Fly.io, Vercel, Railway, Supabase)"
        echo "  • Smoke test results"
        echo "  • Branch name and commit SHA"
        echo "  • Direct link to GitHub Actions workflow run"
        echo ""
        echo -e "${YELLOW}Note: Webhooks are optional. Deployments work without them.${NC}"
        ;;
        
    6)
        echo -e "${CYAN}Exiting...${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}✗ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}Setup Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Test your notifications:${NC}"
echo "  ./scripts/trigger-deploy.sh"
echo ""
echo -e "${CYAN}Or manually trigger a deployment:${NC}"
echo "  gh workflow run deploy-all.yml"
echo ""
echo -e "${YELLOW}Notifications will be sent when deployments complete.${NC}"
echo ""
