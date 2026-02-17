#!/bin/bash

# Setup Datadog APM for performance monitoring
# Run this once to configure Datadog integration

set -e

echo "📈 Datadog APM Setup"
echo "===================="
echo ""

# Check prerequisites
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI not found. Install with: brew install gh (macOS) or apt install gh (Linux)"
  exit 1
fi

# 1. Prompt for Datadog credentials
echo "📝 Step 1: Get your Datadog credentials"
echo "   1. Go to https://www.datadoghq.com (Create free account)"
echo "   2. Go to Organization Settings → API Keys"
echo "   3. Create new API key with 'APM' scope"
echo ""

read -p "Enter your Datadog API Key: " DD_API_KEY

if [ -z "$DD_API_KEY" ]; then
  echo "❌ API key cannot be empty"
  exit 1
fi

echo ""
echo "📝 Step 2: Get your Datadog App Key"
echo "   1. Go to https://app.datadoghq.com/organization/settings/api-keys/org-app-keys"
echo "   2. Create new App Key"
echo ""

read -p "Enter your Datadog App Key: " DD_APP_KEY

echo ""
echo "📝 Step 3: Select your Datadog Site"
echo "   Options:"
echo "   1) US (datadoghq.com)"
echo "   2) EU (datadoghq.eu)"
echo "   3) US3 (us3.datadoghq.com)"
echo ""

read -p "Enter your Datadog Site (default: datadoghq.com): " DD_SITE
DD_SITE=${DD_SITE:-"datadoghq.com"}

# Validate site
case "$DD_SITE" in
  datadoghq.com|datadoghq.eu|us3.datadoghq.com) 
    echo "✅ Site validated: $DD_SITE"
    ;;
  *)
    echo "❌ Invalid site. Must be one of: datadoghq.com, datadoghq.eu, us3.datadoghq.com"
    exit 1
    ;;
esac

echo ""

# 2. Generate application ID
DD_APP_ID=$(uuidgen | tr '[:upper:]' '[:lower:]' | cut -d'-' -f1-2 | tr -d '-')
echo "📝 Step 4: Generated Application ID"
echo "   App ID: $DD_APP_ID"
echo ""

# 3. Generate client token
DD_CLIENT_TOKEN=$(dd if=/dev/urandom bs=1 count=16 2>/dev/null | xxd -p)
echo "📝 Step 5: Generated Client Token"
echo "   Token: ${DD_CLIENT_TOKEN:0:16}..."
echo ""

# 4. Configure GitHub secrets
echo "🔐 Step 6: Configuring GitHub secrets..."
gh secret set DATADOG_API_KEY --env production "$DD_API_KEY"
echo "   ✅ DATADOG_API_KEY configured"

gh secret set DATADOG_APP_KEY --env production "$DD_APP_KEY"
echo "   ✅ DATADOG_APP_KEY configured"

gh secret set NEXT_PUBLIC_DD_APP_ID --env production "$DD_APP_ID"
echo "   ✅ NEXT_PUBLIC_DD_APP_ID configured"

gh secret set NEXT_PUBLIC_DD_CLIENT_TOKEN --env production "$DD_CLIENT_TOKEN"
echo "   ✅ NEXT_PUBLIC_DD_CLIENT_TOKEN configured"

gh secret set NEXT_PUBLIC_DD_SITE --env production "$DD_SITE"
echo "   ✅ NEXT_PUBLIC_DD_SITE configured"

echo ""

# 5. Configure APM environment
gh secret set NEXT_PUBLIC_DD_ENV --env production "production"
echo "   ✅ NEXT_PUBLIC_DD_ENV configured (production)"

echo ""

# 6. Next steps
echo "✅ Datadog APM Setup Complete!"
echo ""
echo "📊 Verification Steps:"
echo "   1. Redeploy your app to activate RUM"
echo "   2. Go to https://app.${DD_SITE}/apm/"
echo "   3. Wait 2-5 minutes for metrics to appear"
echo "   4. Dashboard should show page load times, errors, user sessions"
echo ""
echo "📚 Next Steps:"
echo "   1. Configure RUM dashboards: https://app.${DD_SITE}/rum/sessions"
echo "   2. Set up alerts for high error rates: https://app.${DD_SITE}/monitors/create/apm"
echo "   3. Enable session replay: https://app.${DD_SITE}/rum/settings"
echo ""
echo "🚀 Your performance monitoring is now active!"
echo "   All page loads, user interactions, and errors are being tracked."
echo ""
echo "💡 Pro Tips:"
echo "   - Session replay helps debug user issues"
echo "   - Distributed tracing shows full request paths"
echo "   - Error tracking shows which pages are causing problems"
