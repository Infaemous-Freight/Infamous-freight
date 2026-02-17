#!/bin/bash
# Production Deployment Script for infamousfreight.com
# Last Updated: February 17, 2026

set -e  # Exit on error

echo "🚀 Deploying Infamous Freight Enterprises to infamousfreight.com"
echo "================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase${NC}"
    echo "Running: firebase login"
    firebase login
fi

# Build the web app
echo -e "${YELLOW}📦 Building web app for Firebase (static export)...${NC}"
cd apps/web
pnpm install --frozen-lockfile
BUILD_TARGET=firebase pnpm build

if [ ! -d "out" ]; then
    echo -e "${RED}❌ Build failed - out directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build complete${NC}"
cd ../..

# Deploy to Firebase Hosting
echo ""
echo -e "${YELLOW}🚀 Deploying to Firebase Hosting...${NC}"
firebase deploy --only hosting

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📍 Your site is live at:"
echo "   → https://infamousfreight.web.app (default)"
echo "   → https://infamousfreight.com (custom domain - if DNS configured)"
echo ""
echo "🔧 Next steps:"
echo "   1. Add custom domain in Firebase Console if not done yet"
echo "   2. Configure DNS records (see FIREBASE_HOSTING_DOMAIN_SETUP.md)"
echo "   3. Wait for SSL certificate provisioning (~1 hour)"
echo "   4. Test at https://infamousfreight.com"
echo ""
echo "📊 View deployment details:"
echo "   → https://console.firebase.google.com/project/infamous-freight-prod/hosting"
echo ""
