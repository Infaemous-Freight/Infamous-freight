#!/bin/bash
# GitHub Secrets Setup Script
# Automates adding all required secrets to GitHub Actions

set -e

echo "🔐 GitHub Actions Secrets Setup"
echo "================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI (gh) not found. Install from: https://cli.github.com"
    echo ""
    echo "OR manually add secrets at:"
    echo "https://github.com/MrMiless44/Infamous-freight-enterprises/settings/secrets/actions"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "🔑 Logging into GitHub..."
    gh auth login
fi

REPO="MrMiless44/Infamous-freight-enterprises"

echo "📝 Setting up GitHub Secrets for: $REPO"
echo ""

# 1. FLY_API_TOKEN (Required for CI/CD)
echo "1️⃣  Setting up FLY_API_TOKEN..."
if [ -z "$FLY_API_TOKEN" ]; then
    echo "   ⚠️  FLY_API_TOKEN not in environment"
    echo "   Get it with: flyctl auth token"
    read -p "   Paste your Fly.io token: " fly_token
    FLY_API_TOKEN="$fly_token"
else
    echo "   ✅ Found FLY_API_TOKEN in environment"
fi

gh secret set FLY_API_TOKEN --repo "$REPO" <<< "$FLY_API_TOKEN"
echo "   ✅ FLY_API_TOKEN set"
echo ""

# 2. Optional: Sentry DSN
echo "2️⃣  Setting up SENTRY_DSN (Optional)..."
read -p "   Do you want to set Sentry DSN? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "   Paste your Sentry DSN: " sentry_dsn
    if [ ! -z "$sentry_dsn" ]; then
        gh secret set SENTRY_DSN --repo "$REPO" <<< "$sentry_dsn"
        echo "   ✅ SENTRY_DSN set"
    fi
else
    echo "   ⏭️  Skipped SENTRY_DSN"
fi
echo ""

# 3. Optional: OpenAI API Key
echo "3️⃣  Setting up OPENAI_API_KEY (Optional)..."
read -p "   Do you want to set OpenAI API key? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "   Paste your OpenAI API key (sk-...): " openai_key
    if [ ! -z "$openai_key" ]; then
        gh secret set OPENAI_API_KEY --repo "$REPO" <<< "$openai_key"
        echo "   ✅ OPENAI_API_KEY set"
    fi
else
    echo "   ⏭️  Skipped OPENAI_API_KEY"
fi
echo ""

# 4. Optional: Anthropic API Key
echo "4️⃣  Setting up ANTHROPIC_API_KEY (Optional)..."
read -p "   Do you want to set Anthropic API key? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "   Paste your Anthropic API key (sk-ant-...): " anthropic_key
    if [ ! -z "$anthropic_key" ]; then
        gh secret set ANTHROPIC_API_KEY --repo "$REPO" <<< "$anthropic_key"
        echo "   ✅ ANTHROPIC_API_KEY set"
    fi
else
    echo "   ⏭️  Skipped ANTHROPIC_API_KEY"
fi
echo ""

# List all secrets
echo "📋 Current secrets:"
gh secret list --repo "$REPO"
echo ""

echo "✅ GitHub Secrets setup complete!"
echo ""
echo "Next steps:"
echo "1. Ensure FLY_API_TOKEN is set (REQUIRED)"
echo "2. Deploy API and database via Fly.io dashboard"
echo "3. Push changes to trigger CI/CD: git push origin main"
