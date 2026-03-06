#!/bin/bash

# Initialization script for Infamous Freight Enterprises dev container
# This script ensures all dependencies are installed and properly configured

set -e

echo "🚀 Initializing Infamous Freight Enterprises dev container..."

# Ensure Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    sudo apk add --no-cache nodejs npm
fi

# Verify Node.js
echo "✓ Node.js $(node --version)"
echo "✓ npm $(npm --version)"

# Ensure pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✓ pnpm $(pnpm --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing workspace dependencies..."
    pnpm install
fi

if [ -f package.json ]; then
  if node -e "const p=require('./package.json'); process.exit(p.devDependencies && p.devDependencies.husky ? 0 : 1)" 2>/dev/null; then
    echo "==> Installing Husky hooks"
    pnpm exec husky
  fi
fi

# Build shared package
echo "🏗️ Building shared package..."
pnpm --filter @infamous-freight/shared build

echo ""
echo "✅ Initialization complete!"
echo ""
echo "🎯 Next steps:"
echo "   pnpm dev              # Start all services"
echo "   pnpm test             # Run all tests"
echo "   pnpm test:coverage    # Generate coverage reports"
echo "   pnpm build            # Build all packages"
echo ""
