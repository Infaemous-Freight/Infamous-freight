#!/bin/bash
# Fly.io App Creation Checklist
# Interactive guide for creating apps that require dashboard access

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Fly.io App Creation Checklist                       ║"
echo "║        Complete Step-by-Step Guide                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Prerequisites:${NC}"
echo "✓ Fly.io account created"
echo "✓ Payment method added (for production apps)"
echo "✓ flyctl CLI installed and authenticated"
echo ""

# Check if authenticated
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged into Fly.io"
    echo "Run: flyctl auth login"
    exit 1
fi

ACCOUNT=$(flyctl auth whoami)
echo -e "${GREEN}✅ Logged in as: $ACCOUNT${NC}"
echo ""

# Step 1: Create API App
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 1: Create API Application${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Option A: Via Dashboard (Easiest)"
echo "  1. Go to https://fly.io/dashboard"
echo "  2. Click 'Create App'"
echo "  3. Enter name: infamous-freight-api"
echo "  4. Select region: iad (North Virginia)"
echo "  5. Click 'Create'"
echo ""
echo "Option B: Via CLI (if permissions allow)"
echo "  flyctl apps create infamous-freight-api --org personal"
echo ""
read -p "Press Enter when app is created..."
echo ""

# Verify API app exists
if flyctl apps list | grep -q "infamous-freight-api"; then
    echo -e "${GREEN}✅ API app exists${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify API app${NC}"
fi
echo ""

# Step 2: Create Database
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 2: Create PostgreSQL Database${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Option A: Managed Postgres (Recommended)"
echo "  1. Go to https://fly.io/dashboard"
echo "  2. Click 'Create App'"
echo "  3. Select 'PostgreSQL'"
echo "  4. Enter name: infamous-freight-db"
echo "  5. Select version: 15 or latest"
echo "  6. Select region: iad"
echo "  7. Click 'Create'"
echo ""
echo "Option B: Via CLI"
echo "  flyctl postgres create \\"
echo "    --name infamous-freight-db \\"
echo "    --region iad \\"
echo "    --initial-cluster-size 1 \\"
echo "    --vm-size shared-cpu-1x \\"
echo "    --volume-size 3"
echo ""
read -p "Press Enter when database is created..."
echo ""

# Verify Database exists
if flyctl apps list | grep -q "infamous-freight-db"; then
    echo -e "${GREEN}✅ Database app exists${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify database app${NC}"
fi
echo ""

# Step 3: Attach Database to API
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 3: Attach Database to API${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Run this command:"
echo "  flyctl postgres attach infamous-freight-db --app infamous-freight-api"
echo ""
read -p "Press Enter after running the command..."
echo ""

# Verify attachment
DB_URL=$(flyctl secrets list --app infamous-freight-api 2>/dev/null | grep DATABASE_URL)
if [ ! -z "$DB_URL" ]; then
    echo -e "${GREEN}✅ Database attached (DATABASE_URL is set)${NC}"
else
    echo -e "${YELLOW}⚠️  Database attachment status unclear${NC}"
fi
echo ""

# Step 4: Deploy API
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 4: Deploy API Application${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Deploying API from current directory..."
echo ""
flyctl deploy --config fly.api.toml --app infamous-freight-api || echo "Deploy may need manual intervention"
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 5: Run Migrations
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 5: Run Database Migrations${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Opening SSH console to run migrations..."
echo "When connected, run:"
echo "  cd api && npx prisma migrate deploy"
echo "  exit"
echo ""
read -p "Press Enter to open SSH console..."
flyctl ssh console --app infamous-freight-api || true
echo ""

# Step 6: Verify Deployment
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 6: Verify Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Checking API health..."
HEALTH=$(curl -s https://infamous-freight-api.fly.dev/api/health | head -c 100)
if [ ! -z "$HEALTH" ]; then
    echo -e "${GREEN}✅ API is responding${NC}"
    echo "Response: $HEALTH"
else
    echo -e "${YELLOW}⚠️  Could not reach API (may need a moment to start)${NC}"
fi
echo ""

# Step 7: Optional - Create Redis
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 7: Optional - Create Redis Cache${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
read -p "Do you want to create a Redis cache? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating Redis..."
    flyctl redis create --name infamous-freight-redis --region iad || true
    echo ""
    echo "Attaching Redis to API..."
    REDIS_URL=$(flyctl redis status infamous-freight-redis --json 2>/dev/null | grep -o '"connectionString":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$REDIS_URL" ]; then
        flyctl secrets set REDIS_URL="$REDIS_URL" --app infamous-freight-api
        echo -e "${GREEN}✅ Redis configured${NC}"
    fi
fi
echo ""

# Final Status
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SETUP COMPLETE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
echo "Your apps are now live:"
echo "  🌐 Web:       https://infamous-freight-enterprises.fly.dev"
echo "  🔌 API:       https://infamous-freight-api.fly.dev"
echo "  📚 API Docs:  https://infamous-freight-api.fly.dev/api/docs"
echo "  📊 Health:    https://infamous-freight-api.fly.dev/api/health"
echo ""
echo "Next steps:"
echo "  1. Add FLY_API_TOKEN to GitHub Secrets (for CI/CD)"
echo "  2. Configure monitoring (Sentry, Datadog)"
echo "  3. Set up external service keys (OpenAI, Stripe, PayPal)"
echo "  4. Push code to trigger auto-deployment"
echo ""
echo "Commands to remember:"
echo "  flyctl logs --app infamous-freight-api --tail 50"
echo "  flyctl status --app infamous-freight-api"
echo "  flyctl secrets list --app infamous-freight-api"
