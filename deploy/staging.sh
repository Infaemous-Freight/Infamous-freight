#!/bin/bash
#
# Infamous Freight Enterprises - Staging Deployment Script
# Deploys to staging environment with full testing and verification
#

set -e

echo "📦 Starting Staging Deployment..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STAGING_BRANCH=${STAGING_BRANCH:-staging}
STAGING_SERVER=${STAGING_SERVER:-staging.infamous-freight.app}
STAGING_USER=${STAGING_USER:-deploy}
SLACK_WEBHOOK=${SLACK_WEBHOOK:-}

# Step 1: Verify environment
echo -e "${YELLOW}Step 1: Verifying environment...${NC}"
if [ ! -f "apps/api/.env.staging" ]; then
  echo -e "${RED}Error: apps/api/.env.staging not found${NC}"
  exit 1
fi

# Step 2: Run tests locally
echo -e "${YELLOW}Step 2: Running tests...${NC}"
npm run test || {
  echo -e "${RED}Tests failed!${NC}"
  exit 1
}

# Step 3: Build Docker images
echo -e "${YELLOW}Step 3: Building Docker images...${NC}"
docker build -f apps/api/Dockerfile -t infamous-api:staging ./apps/api || {
  echo -e "${RED}Docker build failed!${NC}"
  exit 1
}

# Step 4: Run migrations
echo -e "${YELLOW}Step 4: Running database migrations...${NC}"
docker run --rm \
  --env-file apps/api/.env.staging \
  infamous-api:staging \
  npx prisma migrate deploy || {
  echo -e "${RED}Migrations failed!${NC}"
  exit 1
}

# Step 5: Seed staging database
echo -e "${YELLOW}Step 5: Seeding staging database...${NC}"
docker run --rm \
  --env-file apps/api/.env.staging \
  infamous-api:staging \
  npx prisma db seed || {
  echo -e "${RED}Seeding failed!${NC}"
  exit 1
}

# Step 6: Optimize database
echo -e "${YELLOW}Step 6: Optimizing database...${NC}"
docker run --rm \
  --env-file apps/api/.env.staging \
  infamous-api:staging \
  npx ts-node src/scripts/optimizeDatabase.js || {
  echo -e "${RED}Database optimization failed!${NC}"
  exit 1
}

# Step 7: Run integration tests
echo -e "${YELLOW}Step 7: Running integration tests...${NC}"
npm run test:integration || {
  echo -e "${RED}Integration tests failed!${NC}"
  exit 1
}

# Step 8: Deploy to staging server
echo -e "${YELLOW}Step 8: Deploying to staging server...${NC}"

ssh ${STAGING_USER}@${STAGING_SERVER} << 'EOF'
  set -e
  cd /var/www/infamous-freight
  
  # Pull latest code
  git fetch origin
  git checkout staging
  git reset --hard origin/staging
  
  # Update dependencies
  npm ci
  
  # Restart services
  docker-compose -f docker-compose.staging.yml down
  docker-compose -f docker-compose.staging.yml up -d
  
  # Wait for services to be ready
  sleep 10
  
  # Run health checks
  curl -f http://localhost:4000/api/health || exit 1
  curl -f http://localhost:3000/api/health || exit 1
EOF

# Step 9: Run smoke tests
echo -e "${YELLOW}Step 9: Running smoke tests...${NC}"
npx playwright test tests/smoke/ || {
  echo -e "${RED}Smoke tests failed!${NC}"
  exit 1
}

# Step 10: Notify team
echo -e "${YELLOW}Step 10: Notifying team...${NC}"
if [ -n "$SLACK_WEBHOOK" ]; then
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d '{
      "text": "✅ Staging deployment successful",
      "attachments": [{
        "color": "good",
        "fields": [
          {"title": "Environment", "value": "Staging", "short": true},
          {"title": "Branch", "value": "'$STAGING_BRANCH'", "short": true},
          {"title": "Server", "value": "'$STAGING_SERVER'", "short": true},
          {"title": "Deployed At", "value": "'$(date)'", "short": true}
        ]
      }]
    }'
fi

echo -e "${GREEN}✅ Staging deployment complete!${NC}"
echo ""
echo "Staging Environment:"
echo "  API: https://api.staging.infamous-freight.app"
echo "  Web: https://staging.infamous-freight.app"
echo ""
echo "Next steps:"
echo "  1. Run end-to-end tests"
echo "  2. Verify features in staging environment"
echo "  3. If all good, merge to main for production"
echo ""
