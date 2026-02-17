#!/bin/bash
# PLAN B - Final Execution Script
# Run this in your local environment (requires Node.js/pnpm)

set -e

echo "🎯 PLAN B - Final Steps to 100%"
echo "================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from: https://nodejs.org"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing..."
    npm install -g pnpm
fi

if ! command -v firebase &> /dev/null; then
    echo "⚠️  Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

echo "✅ All prerequisites installed"
echo ""

# Navigate to web app
cd apps/web

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build for Firebase
echo ""
echo "🔨 Building for Firebase (static export)..."
BUILD_TARGET=firebase pnpm build

# Verify build
if [ ! -d "out" ]; then
    echo "❌ Build failed - out directory not found"
    exit 1
fi

echo "✅ Build successful"
echo ""
echo "Build output:"
du -sh out/
echo ""
ls -lh out/ | head -20
echo ""

# Go back to root
cd ../..

# Ask to deploy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Ready to deploy to Firebase Hosting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Deploy now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to Firebase..."
    firebase deploy --only hosting
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ DEPLOYMENT COMPLETE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Your site is live at:"
    echo "  → https://infamousfreight.web.app"
    echo ""
    echo "Next steps:"
    echo "  1. Configure DNS records (see below)"
    echo "  2. Connect domain in Firebase Console"
    echo "  3. Wait for SSL certificate (1-2 hours)"
    echo "  4. Access via https://infamousfreight.com"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "DNS RECORDS TO ADD"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Add these records to your domain registrar:"
    echo ""
    echo "A Records (Root Domain):"
    echo "  Type: A"
    echo "  Name: @"
    echo "  Value: 151.101.1.195"
    echo "  TTL: 600"
    echo ""
    echo "  Type: A"
    echo "  Name: @"
    echo "  Value: 151.101.65.195"
    echo "  TTL: 600"
    echo ""
    echo "CNAME Record (WWW):"
    echo "  Type: CNAME"
    echo "  Name: www"
    echo "  Value: infamousfreight.web.app"
    echo "  TTL: 600"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "FIREBASE CONSOLE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Connect custom domain:"
    echo "  → https://console.firebase.google.com/project/infamous-freight-prod/hosting"
    echo ""
    echo "Click 'Add custom domain' and enter: infamousfreight.com"
    echo ""
    echo "🎉 You're at 100% when:"
    echo "  ✓ Site loads at infamousfreight.com"
    echo "  ✓ Green padlock (SSL) visible"
    echo "  ✓ Favicon appears in browser tab"
    echo "  ✓ Lighthouse score >90"
    echo ""
else
    echo ""
    echo "⏸️  Deployment skipped"
    echo ""
    echo "To deploy later, run:"
    echo "  firebase deploy --only hosting"
    echo ""
fi
