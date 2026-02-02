#!/bin/bash
set -e

echo "════════════════════════════════════════════════════════════════"
echo "📱 DEPLOYING MOBILE APP TO EXPO EAS"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}⚠️  EAS CLI not found. Installing...${NC}"
    npm install -g eas-cli
    echo -e "${GREEN}✅ EAS CLI installed${NC}"
fi

# Check if logged in
if ! eas whoami &> /dev/null; then
    echo -e "${BLUE}📝 Please login to Expo...${NC}"
    eas login
fi

echo -e "${GREEN}✅ Logged in as: $(eas whoami)${NC}"
echo ""

cd apps/mobile

# Configure EAS if not done
if [ ! -f "eas.json" ]; then
    echo -e "${BLUE}⚙️  Configuring EAS...${NC}"
    eas build:configure
fi

echo ""
echo -e "${YELLOW}📝 API URL Configuration${NC}"
echo "Enter your Railway API URL (e.g., https://infamous-freight-api.railway.app):"
read -r API_URL

# Update .env.production
cat > .env.production << EOF
EXPO_PUBLIC_API_URL=$API_URL
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_SENTRY_DSN=${SENTRY_DSN:-}
EOF

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Build options
echo -e "${BLUE}📦 Build Options:${NC}"
echo "  1. Build Preview (Internal Testing)"
echo "  2. Build Production (App Stores)"
echo "  3. Build All Platforms"
echo "  4. Skip Build (Config Only)"
echo ""
read -p "Select option (1-4): " BUILD_OPTION

case $BUILD_OPTION in
  1)
    echo -e "${BLUE}🔨 Building preview for internal testing...${NC}"
    eas build --platform all --profile preview --non-interactive
    ;;
  2)
    echo -e "${BLUE}🔨 Building production release...${NC}"
    eas build --platform all --profile production --non-interactive
    ;;
  3)
    echo -e "${BLUE}🔨 Building all platforms...${NC}"
    eas build --platform ios --profile production --non-interactive &
    eas build --platform android --profile production --non-interactive &
    wait
    ;;
  4)
    echo -e "${YELLOW}⏭️  Skipping build${NC}"
    ;;
  *)
    echo -e "${RED}❌ Invalid option${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ MOBILE APP BUILD CONFIGURED${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Build Information:${NC}"
echo -e "  Project: ${GREEN}Infamous Freight${NC}"
echo -e "  API URL: ${GREEN}$API_URL${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "  1. Check build status:"
echo "     ${BLUE}eas build:list${NC}"
echo ""
echo "  2. Download builds:"
echo "     ${BLUE}eas build:view --latest${NC}"
echo ""
echo "  3. Submit to stores (when approved):"
echo "     ${BLUE}eas submit --platform ios${NC}"
echo "     ${BLUE}eas submit --platform android${NC}"
echo ""
echo "  4. Track builds:"
echo "     ${BLUE}https://expo.dev/accounts/your-account/projects/infamous-freight/builds${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"

cd ../..
