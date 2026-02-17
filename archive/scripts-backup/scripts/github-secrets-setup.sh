#!/bin/bash

# GitHub Secrets Setup for Railway Deployment
# This script helps you add required secrets to GitHub for Railway CI/CD

set -e

echo "================================"
echo "🔐 GitHub Secrets Setup for Railway"
echo "================================"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Install from: https://cli.github.com"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Not authenticated with GitHub. Running: gh auth login"
    gh auth login
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
echo "✓ Working with repository: $REPO"
echo ""

# Step 1: RAILWAY_TOKEN
echo "📝 Step 1: Get your Railway Token"
echo "   1. Go to: https://railway.app/account/tokens"
echo "   2. Click 'Create New Token'"
echo "   3. Copy the token"
echo ""
read -p "Paste your RAILWAY_TOKEN (or press Enter to skip): " RAILWAY_TOKEN

if [ ! -z "$RAILWAY_TOKEN" ]; then
    echo "Setting RAILWAY_TOKEN..."
    gh secret set RAILWAY_TOKEN --body "$RAILWAY_TOKEN" --repo "$REPO"
    echo "✓ RAILWAY_TOKEN set"
else
    echo "⚠ Skipping RAILWAY_TOKEN"
fi
echo ""

# Step 2: RAILWAY_PROJECT_ID
echo "📝 Step 2: Get your Railway Project ID"
echo "   1. Go to: https://railway.app"
echo "   2. Select your project: 'infamous-freight-prod'"
echo "   3. Get ID from URL or dashboard"
echo ""
read -p "Paste your RAILWAY_PROJECT_ID (or press Enter to skip): " RAILWAY_PROJECT_ID

if [ ! -z "$RAILWAY_PROJECT_ID" ]; then
    echo "Setting RAILWAY_PROJECT_ID..."
    gh secret set RAILWAY_PROJECT_ID --body "$RAILWAY_PROJECT_ID" --repo "$REPO"
    echo "✓ RAILWAY_PROJECT_ID set"
else
    echo "⚠ Skipping RAILWAY_PROJECT_ID"
fi
echo ""

# Step 3: SLACK_WEBHOOK_URL (Optional)
echo "📝 Step 3: (Optional) Slack Notifications"
echo "   To enable Slack notifications on deployments:"
echo "   1. Go to: https://api.slack.com/apps"
echo "   2. Create new Slack App"
echo "   3. Enable Incoming Webhooks"
echo "   4. Create a webhook for your channel"
echo ""
read -p "Paste SLACK_WEBHOOK_URL (optional, press Enter to skip): " SLACK_WEBHOOK_URL

if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    echo "Setting SLACK_WEBHOOK_URL..."
    gh secret set SLACK_WEBHOOK_URL --body "$SLACK_WEBHOOK_URL" --repo "$REPO"
    echo "✓ SLACK_WEBHOOK_URL set"
else
    echo "⚠ Skipping SLACK_WEBHOOK_URL"
fi
echo ""

# Step 4: SENTRY_DSN (Optional)
echo "📝 Step 4: (Optional) Sentry Error Tracking"
echo "   To enable Sentry error tracking:"
echo "   1. Go to: https://sentry.io"
echo "   2. Create project for infamous-freight"
echo "   3. Copy the DSN from Settings → Client Keys"
echo ""
read -p "Paste SENTRY_DSN (optional, press Enter to skip): " SENTRY_DSN

if [ ! -z "$SENTRY_DSN" ]; then
    echo "Setting SENTRY_DSN..."
    gh secret set SENTRY_DSN --body "$SENTRY_DSN" --repo "$REPO"
    echo "✓ SENTRY_DSN set"
else
    echo "⚠ Skipping SENTRY_DSN"
fi
echo ""

# Verify all secrets are set
echo "================================"
echo "📋 Verifying GitHub Secrets"
echo "================================"
echo ""

echo "Current secrets:"
gh secret list --repo "$REPO" || true

echo ""
echo "================================"
echo "✓ GitHub Secrets Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Update .env.example with production URLs"
echo "2. Commit and push changes: git push origin main"
echo "3. Monitor deployment: https://github.com/$REPO/actions"
echo "4. Check Railway dashboard: https://railway.app"
echo ""
echo "For more info, see: RAILWAY_EXECUTION_CHECKLIST.md"
