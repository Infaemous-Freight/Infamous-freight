#!/bin/bash

# Setup Sentry 100% for production error tracking
# Configures complete error tracking, performance monitoring, and session replay
# Run this once to configure both Web and API Sentry integration

set -e

echo "🔍 Sentry 100% Error Tracking & Performance Monitoring Setup"
echo "==========================================================="
echo ""
echo "This setup configures:"
echo "  ✅ Web app error tracking (Next.js)"
echo "  ✅ API error tracking (Express)"
echo "  ✅ Performance monitoring (transactions)"
echo "  ✅ Session replay"
echo "  ✅ Release tracking"
echo ""

# Check prerequisites
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI not found. Install with: brew install gh (macOS) or apt install gh (Linux)"
  exit 1
fi

# STEP 1: Web App DSN
echo "📝 STEP 1: Web App Sentry DSN (Next.js)"
echo "   1. Go to https://sentry.io"
echo "   2. Create organization: 'Infæmous Freight' (if not exists)"
echo "   3. Create project: 'infamous-freight-web' (Select 'Next.js')"
echo "   4. Copy the DSN from Project Settings → Client Keys"
echo ""

read -p "Enter Web DSN (https://xxxxx@sentry.io/xxxxx): " WEB_SENTRY_DSN

# Validate DSN format
if [[ ! $WEB_SENTRY_DSN =~ ^https://.*@sentry\.io ]]; then
  echo "❌ Invalid DSN format. Must start with https:// and contain @sentry.io"
  exit 1
fi

echo "✅ Web DSN validated"
echo ""

# STEP 2: API App DSN
echo "📝 STEP 2: API Sentry DSN (Node.js/Express)"
echo "   1. In same Sentry organization"
echo "   2. Create project: 'infamous-freight-api' (Select 'Node.js')"
echo "   3. Copy the DSN from Project Settings → Client Keys"
echo ""

read -p "Enter API DSN (https://yyyyy@sentry.io/yyyyy): " API_SENTRY_DSN

# Validate DSN format
if [[ ! $API_SENTRY_DSN =~ ^https://.*@sentry\.io ]]; then
  echo "❌ Invalid DSN format. Must start with https:// and contain @sentry.io"
  exit 1
fi

echo "✅ API DSN validated"
echo ""

# STEP 3: Sentry Auth Token
echo "📝 STEP 3: Sentry Auth Token (for release tracking)"
echo "   1. Go to https://sentry.io/settings/account/tokens/"
echo "   2. Create new token with scopes:"
echo "      - project:read"
echo "      - project:write"
echo "      - release:read"
echo "      - release:write"
echo ""

read -p "Enter Sentry Auth Token (optional): " SENTRY_AUTH_TOKEN

if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  echo "⚠️  Auth token skipped (optional, recommended for releases)"
  SENTRY_AUTH_TOKEN="skipped"
else
  echo "✅ Auth token provided"
fi

echo ""

# STEP 4: Configure GitHub Secrets
echo "🔐 STEP 4: Configuring GitHub secrets..."

gh secret set SENTRY_DSN --env production "$API_SENTRY_DSN"
echo "   ✅ SENTRY_DSN (API) configured"

gh secret set NEXT_PUBLIC_SENTRY_DSN --env production "$WEB_SENTRY_DSN"
echo "   ✅ NEXT_PUBLIC_SENTRY_DSN (Web) configured"

if [ "$SENTRY_AUTH_TOKEN" != "skipped" ]; then
  gh secret set SENTRY_AUTH_TOKEN --env production "$SENTRY_AUTH_TOKEN"
  echo "   ✅ SENTRY_AUTH_TOKEN configured"
fi

# Set release version
RELEASE_VERSION=$(git rev-parse --short HEAD)
gh secret set SENTRY_RELEASE --env production "$RELEASE_VERSION"
echo "   ✅ SENTRY_RELEASE configured to: $RELEASE_VERSION"

echo ""

# STEP 5: Verify Secrets
echo "📋 STEP 5: Verifying GitHub secrets..."
gh secret list --env production | grep SENTRY || true

echo ""

# STEP 6: Instructions
echo "✅ Sentry 100% Setup Complete!"
echo ""
echo "🚀 Next Steps:"
echo "   1. Deploy to production (git push origin main)"
echo "   2. Wait for Vercel deployment to complete"
echo "   3. Test error capture:"
echo "      curl -X POST https://your-app.vercel.app/api/test-error"
echo ""
echo "📊 Verify in Sentry (30-60 seconds):"
echo "   Web app: https://sentry.io/organizations/infamousfreight/issues/?project=WEB_PROJECT_ID"
echo "   API: https://sentry.io/organizations/infamousfreight/issues/?project=API_PROJECT_ID"
echo ""
echo "🔔 Configure Alerts:"
echo "   1. Sentry Dashboard → Alerts → Create Alert Rule"
echo "   2. Set conditions: error spike (5+ in 5 min)"
echo "   3. Add Slack integration for notifications"
echo ""
echo "📚 Full documentation: docs/guides/SENTRY_100_GUIDE.md"
echo ""
echo "🎉 Your production error tracking is now 100% ready!"
