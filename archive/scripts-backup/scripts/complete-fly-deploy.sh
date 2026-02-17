#!/bin/bash
# Complete Fly.io Deployment Script
# This script performs all necessary steps to deploy to Fly.io

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_NAME="infamous-freight-api"
DB_NAME="infamous-freight-db"
REGION="iad"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Infamous Freight - Complete Fly.io Deployment           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Ensure flyctl is in PATH
export PATH="/home/vscode/.fly/bin:$PATH"

# Step 1: Verify flyctl is installed
echo -e "${BLUE}[Step 1/8]${NC} Verifying flyctl installation..."
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ flyctl is not installed${NC}"
    echo -e "${YELLOW}Installing flyctl...${NC}"
    curl -L https://fly.io/install.sh | sh
    export PATH="/home/vscode/.fly/bin:$PATH"
fi
echo -e "${GREEN}✅ flyctl is installed: $(flyctl version | head -1)${NC}"
echo ""

# Step 2: Check authentication
echo -e "${BLUE}[Step 2/8]${NC} Checking authentication..."
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with Fly.io${NC}"
    echo ""
    echo -e "${YELLOW}Please authenticate with Fly.io:${NC}"
    echo -e "  ${GREEN}flyctl auth login${NC}"
    echo ""
    echo -e "${YELLOW}Or set your API token:${NC}"
    echo -e "  ${GREEN}export FLY_API_TOKEN=<your-token>${NC}"
    echo ""
    echo "After authenticating, run this script again."
    exit 1
fi
echo -e "${GREEN}✅ Authenticated as: $(flyctl auth whoami)${NC}"
echo ""

# Step 3: Check if app exists, create if not
echo -e "${BLUE}[Step 3/8]${NC} Checking app status..."
if flyctl apps list | grep -q "$APP_NAME"; then
    echo -e "${GREEN}✅ App '$APP_NAME' exists${NC}"
else
    echo -e "${YELLOW}⚠️  App '$APP_NAME' not found. Creating...${NC}"
    flyctl apps create "$APP_NAME" --region "$REGION"
    echo -e "${GREEN}✅ App created${NC}"
fi
echo ""

# Step 4: Check database
echo -e "${BLUE}[Step 4/8]${NC} Checking PostgreSQL database..."
if flyctl pg list | grep -q "$DB_NAME"; then
    echo -e "${GREEN}✅ Database '$DB_NAME' exists${NC}"
else
    echo -e "${YELLOW}⚠️  Database not found. Would you like to create it? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Creating PostgreSQL database...${NC}"
        flyctl pg create --name "$DB_NAME" --region "$REGION"
        echo -e "${YELLOW}Attaching database to app...${NC}"
        flyctl pg attach "$DB_NAME" -a "$APP_NAME"
        echo -e "${GREEN}✅ Database created and attached${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipping database creation. You'll need to set DATABASE_URL manually.${NC}"
    fi
fi
echo ""

# Step 5: Check and set secrets
echo -e "${BLUE}[Step 5/8]${NC} Checking required secrets..."

# Check JWT_SECRET
if flyctl secrets list -a "$APP_NAME" 2>/dev/null | grep -q "JWT_SECRET"; then
    echo -e "${GREEN}✅ JWT_SECRET is set${NC}"
else
    echo -e "${YELLOW}⚠️  JWT_SECRET not set. Generating...${NC}"
    JWT_SECRET=$(openssl rand -base64 32)
    flyctl secrets set JWT_SECRET="$JWT_SECRET" -a "$APP_NAME"
    echo -e "${GREEN}✅ JWT_SECRET set${NC}"
fi

# Check DATABASE_URL (should be auto-set if database attached)
if flyctl secrets list -a "$APP_NAME" 2>/dev/null | grep -q "DATABASE_URL"; then
    echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not set${NC}"
    echo -e "${YELLOW}This is usually auto-set when you attach a database.${NC}"
    echo -e "${YELLOW}If you're using an external database, set it with:${NC}"
    echo -e "  ${GREEN}flyctl secrets set DATABASE_URL='<your-connection-string>' -a $APP_NAME${NC}"
fi

# Optional secrets
echo ""
echo -e "${YELLOW}Optional: Set additional secrets for full functionality:${NC}"
echo -e "  ${GREEN}flyctl secrets set STRIPE_SECRET_KEY='sk_...' -a $APP_NAME${NC}"
echo -e "  ${GREEN}flyctl secrets set PAYPAL_CLIENT_ID='...' -a $APP_NAME${NC}"
echo -e "  ${GREEN}flyctl secrets set AI_PROVIDER='synthetic' -a $APP_NAME${NC}"
echo ""

# Step 6: Validate configuration
echo -e "${BLUE}[Step 6/8]${NC} Validating configuration files..."
if [ ! -f "fly.toml" ]; then
    echo -e "${RED}❌ fly.toml not found${NC}"
    exit 1
fi
if [ ! -f "Dockerfile.fly" ]; then
    echo -e "${RED}❌ Dockerfile.fly not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Configuration files valid${NC}"
echo ""

# Step 7: Deploy
echo -e "${BLUE}[Step 7/8]${NC} Deploying to Fly.io..."
echo -e "${YELLOW}This may take several minutes...${NC}"
echo ""

if flyctl deploy --config fly.toml; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo -e "${YELLOW}Check logs with: flyctl logs -a $APP_NAME${NC}"
    exit 1
fi
echo ""

# Step 8: Verify deployment
echo -e "${BLUE}[Step 8/8]${NC} Verifying deployment..."
echo ""
flyctl status -a "$APP_NAME"
echo ""

# Get the app URL
APP_URL=$(flyctl info -a "$APP_NAME" | grep "Hostname" | awk '{print $3}')
if [ -n "$APP_URL" ]; then
    echo -e "${GREEN}✅ App is live at: https://$APP_URL${NC}"
    echo ""
    echo -e "${BLUE}Testing health endpoint...${NC}"
    if curl -f -s "https://$APP_URL/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check failed or endpoint not responding yet${NC}"
        echo -e "${YELLOW}The app might still be starting up. Check logs with:${NC}"
        echo -e "  ${GREEN}flyctl logs -a $APP_NAME${NC}"
    fi
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Deployment Complete! 🎉                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. View logs: ${GREEN}flyctl logs -a $APP_NAME${NC}"
echo -e "  2. Run migrations: ${GREEN}flyctl ssh console -a $APP_NAME${NC}"
echo -e "     Then: ${GREEN}cd /app && node dist/server.js${NC}"
echo -e "  3. Monitor: ${GREEN}flyctl status -a $APP_NAME${NC}"
echo -e "  4. Dashboard: ${GREEN}https://fly.io/apps/$APP_NAME${NC}"
echo ""
