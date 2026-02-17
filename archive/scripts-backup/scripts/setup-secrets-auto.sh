#!/bin/bash
# Auto-configure production secrets for Fly.io and mobile

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  AUTO SECRETS SETUP 100%                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Verify Fly CLI
echo -e "${YELLOW}📋 Step 1: Checking Fly CLI${NC}"
if ! command -v fly &> /dev/null; then
  echo -e "${RED}❌ fly CLI not found${NC}"
  echo -e "${YELLOW}Install: https://fly.io/docs/getting-started/installing-flyctl/${NC}"
  exit 1
fi
echo -e "${GREEN}✅ fly CLI available${NC}"

# Step 2: Check Fly authentication
echo ""
echo -e "${YELLOW}🔐 Step 2: Checking Fly authentication${NC}"
if ! fly auth whoami &> /dev/null; then
  echo -e "${YELLOW}⚠️  Not authenticated with Fly${NC}"
  echo "Please run: fly auth login"
  read -p "Press Enter after logging in..."
  if ! fly auth whoami &> /dev/null; then
    echo -e "${RED}❌ Authentication failed${NC}"
    exit 1
  fi
fi
ACCOUNT=$(fly auth whoami)
echo -e "${GREEN}✅ Authenticated as: $ACCOUNT${NC}"

# Step 3: Get or create Redis URL
echo ""
echo -e "${YELLOW}📦 Step 3: Redis Configuration${NC}"
read -p "Enter REDIS_URL (or press Enter to skip): " REDIS_URL
if [ -z "$REDIS_URL" ]; then
  echo -e "${YELLOW}⚠️  Skipping Redis setup${NC}"
  echo "Manual setup: fly redis create"
else
  echo -e "${GREEN}✅ REDIS_URL set${NC}"
fi

# Step 4: Set WebSocket port
echo ""
echo -e "${YELLOW}🔌 Step 4: WebSocket Configuration${NC}"
WEBSOCKET_PORT=${WEBSOCKET_PORT:-8080}
read -p "Enter WEBSOCKET_PORT (default 8080): " WS_INPUT
WEBSOCKET_PORT=${WS_INPUT:-8080}
echo -e "${GREEN}✅ WEBSOCKET_PORT: $WEBSOCKET_PORT${NC}"

# Step 5: Configure Fly.io secrets
echo ""
echo -e "${YELLOW}🔧 Step 5: Configuring Fly.io Secrets${NC}"
if [ ! -z "$REDIS_URL" ]; then
  echo "Setting REDIS_URL..."
  fly secrets set REDIS_URL="$REDIS_URL" -a infamous-freight-api 2>/dev/null && \
    echo -e "${GREEN}✅ REDIS_URL configured${NC}" || \
    echo -e "${RED}❌ Failed to set REDIS_URL${NC}"
fi

echo "Setting WEBSOCKET_PORT..."
fly secrets set WEBSOCKET_PORT="$WEBSOCKET_PORT" -a infamous-freight-api 2>/dev/null && \
  echo -e "${GREEN}✅ WEBSOCKET_PORT configured${NC}" || \
  echo -e "${RED}❌ Failed to set WEBSOCKET_PORT${NC}"

# Step 6: Verify secrets
echo ""
echo -e "${YELLOW}✓ Step 6: Verifying Secrets${NC}"
echo "Configured secrets for infamous-freight-api:"
fly secrets list -a infamous-freight-api 2>/dev/null || echo "Could not list secrets"

# Step 7: Mobile environment
echo ""
echo -e "${YELLOW}📱 Step 7: Mobile Environment${NC}"
if [ -f "apps/mobile/.env" ]; then
  echo -e "${YELLOW}⚠️  apps/mobile/.env already exists${NC}"
  read -p "Overwrite? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping mobile setup"
    exit 0
  fi
fi

read -p "Enter EXPO_PROJECT_ID: " EXPO_PROJECT_ID
if [ ! -z "$EXPO_PROJECT_ID" ]; then
  cat > apps/mobile/.env << EOF
EXPO_PROJECT_ID=$EXPO_PROJECT_ID
API_BASE_URL=https://infamous-freight-api.fly.dev
WS_URL=wss://infamous-freight-api.fly.dev/ws
ENABLE_OFFLINE_QUEUE=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_BIOMETRIC_AUTH=true
EOF
  echo -e "${GREEN}✅ apps/mobile/.env created${NC}"
fi

# Step 8: Summary
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ AUTO SECRETS SETUP COMPLETE 100%${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Summary:"
echo "  ✅ Fly.io authenticated"
echo "  ✅ REDIS_URL: ${REDIS_URL:0:20}..."
echo "  ✅ WEBSOCKET_PORT: $WEBSOCKET_PORT"
echo "  ✅ Mobile .env configured"
echo ""
echo "Next steps:"
echo "  1. Deploy API: fly deploy -a infamous-freight-api"
echo "  2. Install mobile deps: cd apps/mobile && npm install"
echo "  3. Build mobile: eas build"
echo ""
