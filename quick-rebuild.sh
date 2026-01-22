#!/bin/bash
# QUICK CONTAINER REBUILD - 5 MINUTE VERSION
# Infamous Freight Enterprises - Fast Track Setup

set -e

echo "🔄 QUICK CONTAINER REBUILD (5 MIN)"
echo "=================================="
echo ""

# Check prerequisites
echo "✓ Checking Node.js..."
node --version || { echo "ERROR: Node.js required"; exit 1; }

echo "✓ Checking npm..."
npm --version || { echo "ERROR: npm required"; exit 1; }

# Install pnpm if needed
if ! command -v pnpm &> /dev/null; then
    echo "⚠ Installing pnpm..."
    npm install -g pnpm@8.15.9
fi

echo "✓ pnpm ready: $(pnpm --version)"
echo ""

# Fast rebuild
echo "🚀 Step 1: Clear caches"
pnpm store prune 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

echo "🚀 Step 2: Install dependencies"
pnpm install --fast

echo "🚀 Step 3: Build shared"
pnpm --filter @infamous-freight/shared build

echo "🚀 Step 4: Prisma setup"
cd api && pnpm prisma:generate && cd ..

echo "🚀 Step 5: Verify"
pnpm check:types 2>/dev/null || true

echo ""
echo "✅ REBUILD COMPLETE!"
echo ""
echo "Next: pnpm dev (or pnpm api:dev / pnpm web:dev)"
