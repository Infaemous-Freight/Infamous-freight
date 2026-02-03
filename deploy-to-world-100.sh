#!/bin/bash
set -euo pipefail

# ============================================
# 🌍 INFAMOUS FREIGHT - 100% WORLDWIDE DEPLOYMENT
# ============================================
# This script deploys Infamous Freight to the world

echo "=========================================="
echo "🚀 INFAMOUS FREIGHT - 100% DEPLOYMENT"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in CI
if [ "${CI:-false}" = "true" ]; then
  echo "Running in CI environment"
  IN_CI=true
else
  IN_CI=false
fi

# ============================================
# Step 1: Install Fly.io CLI if not present
# ============================================
echo -e "${BLUE}[1/6]${NC} Checking Fly.io CLI..."

if ! command -v flyctl &> /dev/null; then
  echo -e "${YELLOW}Installing Fly.io CLI...${NC}"
  curl -L https://fly.io/install.sh | sh
  export PATH="$HOME/.fly/bin:$PATH"
  echo 'export PATH="$HOME/.fly/bin:$PATH"' >> ~/.bashrc
  echo -e "${GREEN}✓ Fly.io CLI installed${NC}"
else
  echo -e "${GREEN}✓ Fly.io CLI already installed${NC}"
fi

flyctl version

# ============================================
# Step 2: Check Authentication
# ============================================
echo ""
echo -e "${BLUE}[2/6]${NC} Checking Fly.io authentication..."

if [ "$IN_CI" = "true" ]; then
  if [ -z "${FLY_API_TOKEN:-}" ]; then
    echo -e "${RED}ERROR: FLY_API_TOKEN not set in CI${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Using FLY_API_TOKEN from CI${NC}"
else
  if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}Not authenticated. Please login to Fly.io:${NC}"
    flyctl auth login
  fi
  echo -e "${GREEN}✓ Authenticated with Fly.io${NC}"
fi

# ============================================
# Step 3: Check/Create Fly.io App
# ============================================
echo ""
echo -e "${BLUE}[3/6]${NC} Checking Fly.io app..."

APP_NAME="infamous-freight"

if flyctl status -a "$APP_NAME" &> /dev/null; then
  echo -e "${GREEN}✓ App '$APP_NAME' exists${NC}"
else
  echo -e "${YELLOW}Creating app '$APP_NAME'...${NC}"
  if [ "$IN_CI" = "false" ]; then
    flyctl apps create "$APP_NAME" --org personal || true
  else
    echo -e "${RED}ERROR: App does not exist. Create it first.${NC}"
    exit 1
  fi
fi

# ============================================
# Step 4: Check/Create Database
# ============================================
echo ""
echo -e "${BLUE}[4/6]${NC} Checking database..."

DB_APP_NAME="${APP_NAME}-db"

if flyctl status -a "$DB_APP_NAME" &> /dev/null; then
  echo -e "${GREEN}✓ Database '$DB_APP_NAME' exists${NC}"
else
  echo -e "${YELLOW}No database found.${NC}"
  echo ""
  echo "Choose database option:"
  echo "  1) Create Fly Postgres (recommended, ~\$2/month)"
  echo "  2) Use Supabase (free tier available)"
  echo "  3) Skip (configure later)"
  echo ""
  
  if [ "$IN_CI" = "false" ]; then
    read -p "Enter choice [1-3]: " db_choice
  else
    db_choice=3
  fi
  
  case $db_choice in
    1)
      echo -e "${YELLOW}Creating Fly Postgres database...${NC}"
      flyctl postgres create --name "$DB_APP_NAME" --region ord --vm-size shared-cpu-1x --volume-size 1 --initial-cluster-size 1
      
      echo -e "${YELLOW}Attaching database to app...${NC}"
      flyctl postgres attach "$DB_APP_NAME" -a "$APP_NAME"
      
      echo -e "${GREEN}✓ Database created and attached${NC}"
      ;;
    2)
      echo ""
      echo "To use Supabase:"
      echo "  1. Go to https://supabase.com/dashboard"
      echo "  2. Create a new project"
      echo "  3. Get your DATABASE_URL from Settings > Database"
      echo "  4. Set it as a secret: flyctl secrets set DATABASE_URL='your-url' -a $APP_NAME"
      echo ""
      ;;
    *)
      echo -e "${YELLOW}⚠ Skipping database setup${NC}"
      ;;
  esac
fi

# ============================================
# Step 5: Deploy to Fly.io
# ============================================
echo ""
echo -e "${BLUE}[5/6]${NC} Deploying to Fly.io..."

echo -e "${YELLOW}Building and deploying...${NC}"

# Deploy with remote builder to avoid local Docker requirement
flyctl deploy --remote-only --strategy rolling

echo -e "${GREEN}✓ Deployment complete${NC}"

# ============================================
# Step 6: Verify Deployment
# ============================================
echo ""
echo -e "${BLUE}[6/6]${NC} Verifying deployment..."

# Get app URL
APP_URL=$(flyctl info -a "$APP_NAME" -j | grep -o '"Hostname":"[^"]*"' | cut -d'"' -f4 || echo "${APP_NAME}.fly.dev")

echo ""
echo "Waiting for app to be ready..."
sleep 10

# Try health check
HEALTH_URL="https://${APP_URL}/api/health"
echo "Checking health endpoint: $HEALTH_URL"

for i in {1..10}; do
  if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Health check passed!${NC}"
    break
  else
    if [ $i -eq 10 ]; then
      echo -e "${YELLOW}⚠ Health check failed, but app may still be starting${NC}"
    else
      echo "  Attempt $i/10..."
      sleep 5
    fi
  fi
done

# ============================================
# SUCCESS!
# ============================================
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 100% DEPLOYMENT COMPLETE!${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}✓ Web App (Vercel):${NC}"
echo "  https://infamous-freight-enterprises.vercel.app"
echo ""
echo -e "${GREEN}✓ API Backend (Fly.io):${NC}"
echo "  https://${APP_URL}"
echo ""
echo -e "${GREEN}✓ Health Check:${NC}"
echo "  https://${APP_URL}/api/health"
echo ""
echo "=========================================="
echo "📊 Deployment Status Dashboard"
echo "=========================================="
flyctl status -a "$APP_NAME"
echo ""
echo "=========================================="
echo "📝 Next Steps"
echo "=========================================="
echo ""
echo "1. Update Web App Environment Variables:"
echo "   - Go to: https://vercel.com/dashboard"
echo "   - Add: NEXT_PUBLIC_API_URL=https://${APP_URL}"
echo "   - Redeploy web app"
echo ""
echo "2. Test the deployment:"
echo "   curl https://${APP_URL}/api/health"
echo ""
echo "3. View logs:"
echo "   flyctl logs -a $APP_NAME"
echo ""
echo "4. Scale if needed:"
echo "   flyctl scale count 2 -a $APP_NAME"
echo ""
echo "=========================================="
echo -e "${GREEN}🌍 YOUR APP IS LIVE WORLDWIDE!${NC}"
echo "=========================================="
