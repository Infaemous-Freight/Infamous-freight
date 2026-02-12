#!/bin/bash
# Production deployment script

set -e

echo "🚀 Starting Production Deployment..."

# Configuration
export NODE_ENV=production
API_DIR="/workspaces/Infamous-freight-enterprises/apps/api"
WEB_DIR="/workspaces/Infamous-freight-enterprises/apps/web"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${2}${1}${NC}"
}

# Pre-deployment checks
print_status "\n📋 Step 1: Pre-deployment checks" "$YELLOW"

# Check if required environment variables are set
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "REDIS_URL"
    "NODE_ENV"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_status "❌ Missing required variable: $var" "$RED"
        exit 1
    fi
done

print_status "✅ All required environment variables present" "$GREEN"

# Step 2: Install dependencies
print_status "\n📦 Step 2: Installing dependencies" "$YELLOW"
cd "$API_DIR"
pnpm install --frozen-lockfile
cd "$WEB_DIR"
pnpm install --frozen-lockfile

# Step 3: Run tests
print_status "\n🧪 Step 3: Running tests" "$YELLOW"
cd "$API_DIR"
pnpm test || {
    print_status "❌ Tests failed - deployment aborted" "$RED"
    exit 1
}
print_status "✅ All tests passed" "$GREEN"

# Step 4: Build API
print_status "\n🔨 Step 4: Building API" "$YELLOW"
cd "$API_DIR"
pnpm build
print_status "✅ API build complete" "$GREEN"

# Step 5: Build Web
print_status "\n🌐 Step 5: Building Web" "$YELLOW"
cd "$WEB_DIR"
pnpm build
print_status "✅ Web build complete" "$GREEN"

# Step 6: Database migrations
print_status "\n🗄️  Step 6: Running database migrations" "$YELLOW"
cd "$API_DIR"
pnpm prisma migrate deploy
pnpm prisma generate
print_status "✅ Database migrations complete" "$GREEN"

# Step 7: Security audit
print_status "\n🔒 Step 7: Security audit" "$YELLOW"
bash /workspaces/Infamous-freight-enterprises/scripts/security-audit.sh

# Step 8: Start services with PM2
print_status "\n🎯 Step 8: Starting services" "$YELLOW"

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Start API
cd "$API_DIR"
pm2 start dist/server.js --name "api" --instances 2 --exec-mode cluster

# Start Web
cd "$WEB_DIR"
pm2 start "pnpm start" --name "web"

# Save PM2 process list
pm2 save

print_status "\n✅ Deployment complete!" "$GREEN"
print_status "\n📊 Service Status:" "$YELLOW"
pm2 status

print_status "\n🔗 Services running at:" "$GREEN"
echo "   API: http://localhost:3001"
echo "   Web: http://localhost:3000"
echo "   Health: http://localhost:3001/api/health"
echo "   Metrics: http://localhost:3001/api/metrics"

print_status "\n💡 Next steps:" "$YELLOW"
echo "   1. Monitor logs: pm2 logs"
echo "   2. Monitor metrics: pm2 monit"
echo "   3. Setup SSL certificate"
echo "   4. Configure reverse proxy (nginx)"
echo "   5. Run load tests"
echo "   6. Setup monitoring dashboards"
