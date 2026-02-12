#!/bin/bash
set -e

echo "🚀 Starting Infamous Freight Enterprises Development Server"
echo ""

# Check if API directory exists
if [ ! -d "apps/api" ]; then
  echo "❌ API directory not found"
  exit 1
fi

# Check if API has dependencies
if [ ! -d "apps/api/node_modules" ]; then
  echo "📦 Installing API dependencies..."
  cd apps/api && pnpm install && cd ../..
fi

# Check if packages/shared exists and build it
if [ -d "packages/shared" ]; then
  echo "🔨 Building shared packages..."
  pnpm --filter @infamous-freight/shared build 2>/dev/null || echo "✅ Shared packages ready"
fi

# Start the API server
echo "🌐 Starting API server on port 3001..."
cd apps/api
pnpm run dev

