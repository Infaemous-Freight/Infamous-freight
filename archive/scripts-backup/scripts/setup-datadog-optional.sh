#!/bin/bash

# Optional Datadog APM Setup
# This is NOT required for Vercel + Supabase stack
# Sentry + Vercel Analytics is sufficient for most

set -e

echo "📊 Datadog APM Setup (Optional)"
echo "==============================="
echo ""

echo "⚠️  NOTE: Datadog is OPTIONAL for this stack"
echo ""
echo "Your Vercel + Supabase stack already includes:"
echo "  ✅ Sentry (error tracking)"
echo "  ✅ Vercel Analytics (performance metrics)"
echo "  ✅ Supabase monitoring (database)"
echo ""
echo "Datadog adds:"
echo "  - Distributed tracing across services"
echo "  - Advanced APM metrics"
echo "  - Session replay"
echo ""
echo "For most projects, Sentry + Vercel Analytics is sufficient."
echo "Deploy without Datadog first, then add if needed."
echo ""

read -p "Continue with Datadog setup? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Skipping Datadog setup."
  exit 0
fi

echo ""
echo "To set up Datadog:"
echo ""
echo "1. Create Datadog account:"
echo "   https://www.datadoghq.com"
echo ""
echo "2. Get API Key:"
echo "   Settings → API → New API Key"
echo ""
echo "3. Store in GitHub:"
echo "   gh secret set DATADOG_API_KEY --env production '[KEY]'"
echo ""
echo "4. Enable in app (optional RUM):"
echo "   apps/web/pages/_app.tsx"
echo ""
echo "✅ Datadog optional setup complete!"
