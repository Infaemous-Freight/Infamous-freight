#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Build Validation Script - Checks configuration before deployment

set -e

echo "🔍 Validating build configuration..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from web directory"
  exit 1
fi

# Validate Datadog Analytics configuration
if [ -z "$NEXT_PUBLIC_DD_APP_ID" ]; then
  echo "⚠️  Warning: NEXT_PUBLIC_DD_APP_ID not set - Datadog RUM disabled"
fi

if [ -z "$NEXT_PUBLIC_DD_CLIENT_TOKEN" ]; then
  echo "⚠️  Warning: NEXT_PUBLIC_DD_CLIENT_TOKEN not set - Datadog RUM disabled"
fi

if [ -z "$NEXT_PUBLIC_DD_SITE" ]; then
  echo "⚠️  Warning: NEXT_PUBLIC_DD_SITE not set - Datadog RUM disabled"
fi

# Validate Vercel Analytics (auto-enabled in Vercel, but check env awareness)
if [ "$NEXT_PUBLIC_ENV" = "production" ]; then
  echo "✅ Production environment detected - Analytics will be active"
else
  echo "ℹ️  Non-production environment: $NEXT_PUBLIC_ENV"
fi

# Check for required API base URL
if [ -z "$NEXT_PUBLIC_API_BASE_URL" ]; then
  echo "⚠️  Warning: NEXT_PUBLIC_API_BASE_URL not set"
else
  echo "✅ API Base URL: $NEXT_PUBLIC_API_BASE_URL"
fi

# Validate Next.js configuration exists
if [ ! -f "next.config.mjs" ]; then
  echo "❌ Error: next.config.mjs not found"
  exit 1
fi

# Check for TypeScript configuration
if [ ! -f "tsconfig.json" ]; then
  echo "❌ Error: tsconfig.json not found"
  exit 1
fi

echo "✅ Build validation complete"
exit 0
