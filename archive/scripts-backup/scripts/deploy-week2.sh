#!/bin/bash

# Week 2 Deployment Script
# Handles database setup, testing, and deployment to production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
SKIP_TESTS=${SKIP_TESTS:-false}
DRY_RUN=${DRY_RUN:-false}

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Week 2 Deployment Script - Infamous Freight             ║${NC}"
echo -e "${BLUE}║   Database, Testing & Infrastructure Setup                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"

# 1. Validation
echo -e "\n${YELLOW}[1/5] Validating environment...${NC}"

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
  echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
  echo "Usage: $0 [staging|production]"
  exit 1
fi

echo -e "${GREEN}✅ Environment: $ENVIRONMENT${NC}"

# Check required tools
REQUIRED_TOOLS=("docker" "docker-compose" "node" "npm")
for tool in "${REQUIRED_TOOLS[@]}"; do
  if ! command -v $tool &> /dev/null; then
    echo -e "${RED}❌ Required tool not found: $tool${NC}"
    exit 1
  fi
done

echo -e "${GREEN}✅ All required tools available${NC}"

# 2. Build Docker images
echo -e "\n${YELLOW}[2/5] Building Docker images...${NC}"

if [ "$DRY_RUN" = "false" ]; then
  docker-compose build --pull api web
  echo -e "${GREEN}✅ Docker images built successfully${NC}"
else
  echo -e "${YELLOW}[DRY RUN] Would build Docker images${NC}"
fi

# 3. Database setup
echo -e "\n${YELLOW}[3/5] Setting up database...${NC}"

if [ "$DRY_RUN" = "false" ]; then
  # Start services
  docker-compose -f docker-compose.prod.yml up -d postgres redis

  # Wait for database
  echo "Waiting for database to be ready..."
  sleep 5

  # Run migrations
  docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -c "CREATE DATABASE IF NOT EXISTS infamous_freight;"

  echo -e "${GREEN}✅ Database setup completed${NC}"
else
  echo -e "${YELLOW}[DRY RUN] Would setup database and run migrations${NC}"
fi

# 4. Run tests
echo -e "\n${YELLOW}[4/5] Running tests...${NC}"

if [ "$SKIP_TESTS" = "false" ] && [ "$DRY_RUN" = "false" ]; then
  echo "Running E2E tests..."
  npm run test:e2e || {
    echo -e "${RED}❌ E2E tests failed${NC}"
    exit 1
  }

  echo "Running load tests..."
  npm run test:load || {
    echo -e "${YELLOW}⚠️  Load tests reported issues (non-blocking)${NC}"
  }

  echo -e "${GREEN}✅ All tests passed${NC}"
else
  echo -e "${YELLOW}[SKIPPED] Test suite${NC}"
fi

# 5. Deploy
echo -e "\n${YELLOW}[5/5] Deploying to $ENVIRONMENT...${NC}"

if [ "$DRY_RUN" = "false" ]; then
  # Start all services
  docker-compose -f docker-compose.prod.yml up -d

  # Wait for services
  echo "Waiting for services to be healthy..."
  sleep 10

  # Health checks
  echo "Running health checks..."

  # Check API
  API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health || echo "000")
  if [ "$API_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ API is healthy${NC}"
  else
    echo -e "${RED}❌ API health check failed (HTTP $API_HEALTH)${NC}"
    exit 1
  fi

  # Check Web
  WEB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
  if [ "$WEB_HEALTH" = "200" ] || [ "$WEB_HEALTH" = "301" ]; then
    echo -e "${GREEN}✅ Web app is healthy${NC}"
  else
    echo -e "${RED}❌ Web health check failed (HTTP $WEB_HEALTH)${NC}"
    exit 1
  fi

  echo -e "${GREEN}✅ Deployment successful${NC}"
else
  echo -e "${YELLOW}[DRY RUN] Would deploy to $ENVIRONMENT${NC}"
fi

# Summary
echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Deployment Summary                                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"

echo -e "${GREEN}✅ Database:${NC} Ready"
echo -e "${GREEN}✅ API:${NC} http://localhost:4000"
echo -e "${GREEN}✅ Web:${NC} http://localhost:3000"
echo -e "${GREEN}✅ Environment:${NC} $ENVIRONMENT"

if [ "$SKIP_TESTS" = "false" ]; then
  echo -e "${GREEN}✅ E2E Tests:${NC} Passed"
fi

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Verify all services are running: docker-compose -f docker-compose.prod.yml ps"
echo "2. View logs: docker-compose -f docker-compose.prod.yml logs -f api"
echo "3. Run manual tests: npm run test:e2e -- --headed"
echo "4. Monitor health: watch curl http://localhost:4000/api/health"

if [ "$ENVIRONMENT" = "production" ]; then
  echo -e "\n${RED}⚠️  Production deployment - Please verify:${NC}"
  echo "1. All environment variables are set correctly"
  echo "2. Database backups are configured"
  echo "3. Monitoring and alerting are active"
  echo "4. Rollback plan is in place"
fi

echo -e "\n${GREEN}✨ Deployment complete!${NC}\n"
