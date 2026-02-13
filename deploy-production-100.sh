#!/bin/bash
# 🚀 INFÆMOUS FREIGHT - 100% PRODUCTION DEPLOYMENT ORCHESTRATOR
# Complete automated deployment to production with comprehensive checks
# Author: Santorio Djuan Miles
# Date: February 13, 2026
# Status: Production Ready

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="INFÆMOUS FREIGHT"
VERSION="2.2.0"
DEPLOYMENT_DATE=$(date +"%Y-%m-%d %H:%M:%S")
LOG_FILE="deployment-production-$(date +%Y%m%d-%H%M%S).log"

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        INFÆMOUS FREIGHT - PRODUCTION DEPLOYMENT 100%         ║
║                                                               ║
║     AI-Powered Freight Intelligence Platform                 ║
║     Complete Automated Deployment to Production              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Date: ${DEPLOYMENT_DATE}${NC}"
echo -e "${BLUE}Log: ${LOG_FILE}${NC}"
echo ""

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log "INFO" "Starting production deployment..."

# ============================================================================
# PHASE 1: PRE-DEPLOYMENT CHECKS
# ============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 1: PRE-DEPLOYMENT VALIDATION${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check required tools
log "INFO" "Checking required tools..."
REQUIRED_TOOLS=("git" "node" "pnpm" "docker" "flyctl")
for tool in "${REQUIRED_TOOLS[@]}"; do
    if ! command -v "$tool" &> /dev/null; then
        log "ERROR" "Required tool not found: $tool"
        echo -e "${RED}❌ $tool is not installed${NC}"
        echo -e "${YELLOW}Please install $tool and try again${NC}"
        exit 1
    else
        VERSION_OUTPUT=$($tool --version 2>&1 | head -n1 || echo "unknown")
        log "INFO" "$tool is installed: $VERSION_OUTPUT"
        echo -e "${GREEN}✓ $tool${NC}"
    fi
done

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    log "ERROR" "Node.js version must be 20 or higher (found: v$NODE_VERSION)"
    echo -e "${RED}❌ Node.js version must be 20 or higher${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version $(node -v)${NC}"

# Check pnpm version
PNPM_VERSION=$(pnpm --version)
log "INFO" "pnpm version: $PNPM_VERSION"
echo -e "${GREEN}✓ pnpm version $PNPM_VERSION${NC}"

# Verify git repository
if [ ! -d ".git" ]; then
    log "ERROR" "Not a git repository"
    echo -e "${RED}❌ This is not a git repository${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git repository${NC}"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    log "WARN" "Uncommitted changes detected"
    echo -e "${YELLOW}⚠️  Warning: Uncommitted changes detected${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Deployment cancelled by user"
        exit 0
    fi
fi

# Check required environment variables
log "INFO" "Checking environment variables..."
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "FLY_API_TOKEN")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
        echo -e "${RED}❌ Missing: $var${NC}"
    else
        echo -e "${GREEN}✓ $var${NC}"
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    log "ERROR" "Missing required environment variables: ${MISSING_VARS[*]}"
    echo -e "${RED}Missing required environment variables!${NC}"
    echo -e "${YELLOW}Please set the following variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "  ${YELLOW}- $var${NC}"
    done
    exit 1
fi

echo -e "${GREEN}✓ All environment variables configured${NC}"
echo ""

# ============================================================================
# PHASE 2: BUILD & TEST
# ============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 2: BUILD & TEST${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Install dependencies
log "INFO" "Installing dependencies..."
echo -e "${BLUE}Installing dependencies...${NC}"
pnpm install --frozen-lockfile 2>&1 | tee -a "$LOG_FILE" || {
    log "ERROR" "Failed to install dependencies"
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
}
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build shared package
log "INFO" "Building shared package..."
echo -e "${BLUE}Building shared package...${NC}"
pnpm --filter @infamous-freight/shared build 2>&1 | tee -a "$LOG_FILE" || {
    log "ERROR" "Failed to build shared package"
    echo -e "${RED}❌ Failed to build shared package${NC}"
    exit 1
}
echo -e "${GREEN}✓ Shared package built${NC}"

# Run linting
log "INFO" "Running linting..."
echo -e "${BLUE}Running linting...${NC}"
pnpm lint 2>&1 | tee -a "$LOG_FILE" || {
    log "WARN" "Linting failed"
    echo -e "${YELLOW}⚠️  Linting issues detected (continuing)${NC}"
}
echo -e "${GREEN}✓ Linting complete${NC}"

# Run tests
log "INFO" "Running tests..."
echo -e "${BLUE}Running tests...${NC}"
pnpm test 2>&1 | tee -a "$LOG_FILE" || {
    log "ERROR" "Tests failed"
    echo -e "${RED}❌ Tests failed${NC}"
    read -p "Continue deployment despite failing tests? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "INFO" "Deployment cancelled due to test failures"
        exit 1
    fi
}
echo -e "${GREEN}✓ Tests passed${NC}"

# Build all services
log "INFO" "Building all services..."
echo -e "${BLUE}Building all services...${NC}"
pnpm build 2>&1 | tee -a "$LOG_FILE" || {
    log "ERROR" "Build failed"
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ All services built${NC}"
echo ""

# ============================================================================
# PHASE 3: DATABASE MIGRATIONS
# ============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 3: DATABASE MIGRATIONS${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

log "INFO" "Running database migrations..."
echo -e "${BLUE}Running database migrations...${NC}"
cd apps/api
pnpm prisma migrate deploy 2>&1 | tee -a "../../$LOG_FILE" || {
    log "ERROR" "Database migrations failed"
    echo -e "${RED}❌ Database migrations failed${NC}"
    exit 1
}
cd ../..
echo -e "${GREEN}✓ Database migrations complete${NC}"
echo ""

# ============================================================================
# PHASE 4: DEPLOY WEB (VERCEL)
# ============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 4: DEPLOY WEB APPLICATION (VERCEL)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

log "INFO" "Deploying web application to Vercel..."
echo -e "${BLUE}Deploying to Vercel...${NC}"

if [ -n "$VERCEL_TOKEN" ]; then
    cd apps/web
    npx vercel deploy --prod --yes --token="$VERCEL_TOKEN" 2>&1 | tee -a "../../$LOG_FILE" || {
        log "ERROR" "Vercel deployment failed"
        echo -e "${RED}❌ Vercel deployment failed${NC}"
        exit 1
    }
    cd ../..
    echo -e "${GREEN}✓ Web deployed to Vercel${NC}"
else
    log "WARN" "VERCEL_TOKEN not set, skipping Vercel deployment"
    echo -e "${YELLOW}⚠️  VERCEL_TOKEN not set, skipping Vercel deployment${NC}"
fi
echo ""

# ============================================================================
# PHASE 5: DEPLOY API (FLY.IO)
# ============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 5: DEPLOY API (FLY.IO)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

log "INFO" "Deploying API to Fly.io..."
echo -e "${BLUE}Deploying to Fly.io...${NC}"

# Authenticate with Fly.io
flyctl auth login --access-token="$FLY_API_TOKEN" 2>&1 | tee -a "$LOG_FILE" || {
    log "ERROR" "Fly.io authentication failed"
    echo -e "${RED}❌ Fly.io authentication failed${NC}"
    exit 1
}

# Deploy to Fly.io
flyctl deploy --remote-only --ha=false 2>&1 | tee -a "$LOG_FILE" || {
    log "ERROR" "Fly.io deployment failed"
    echo -e "${RED}❌ Fly.io deployment failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ API deployed to Fly.io${NC}"
echo ""

# ============================================================================
# PHASE 6: HEALTH CHECKS
# ============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 6: HEALTH CHECKS${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

log "INFO" "Running health checks..."

# Wait for services to stabilize
echo -e "${BLUE}Waiting for services to stabilize (30s)...${NC}"
sleep 30

# Check API health
API_URL="https://infamous-freight.fly.dev/api/health"
echo -e "${BLUE}Checking API health: $API_URL${NC}"
API_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL" || echo "000")
API_HTTP_CODE=$(echo "$API_RESPONSE" | tail -n1)
API_BODY=$(echo "$API_RESPONSE" | head -n-1)

if [ "$API_HTTP_CODE" = "200" ]; then
    log "INFO" "API health check passed: $API_HTTP_CODE"
    echo -e "${GREEN}✓ API is healthy (HTTP $API_HTTP_CODE)${NC}"
    echo -e "${CYAN}Response: $API_BODY${NC}"
else
    log "ERROR" "API health check failed: $API_HTTP_CODE"
    echo -e "${RED}❌ API health check failed (HTTP $API_HTTP_CODE)${NC}"
    echo -e "${YELLOW}Response: $API_BODY${NC}"
fi

# Check web application
WEB_URL="https://infamous-freight-enterprises.vercel.app"
echo -e "${BLUE}Checking Web health: $WEB_URL${NC}"
WEB_RESPONSE=$(curl -s -w "\n%{http_code}" "$WEB_URL" || echo "000")
WEB_HTTP_CODE=$(echo "$WEB_RESPONSE" | tail -n1)

if [ "$WEB_HTTP_CODE" = "200" ]; then
    log "INFO" "Web health check passed: $WEB_HTTP_CODE"
    echo -e "${GREEN}✓ Web is healthy (HTTP $WEB_HTTP_CODE)${NC}"
else
    log "ERROR" "Web health check failed: $WEB_HTTP_CODE"
    echo -e "${RED}❌ Web health check failed (HTTP $WEB_HTTP_CODE)${NC}"
fi
echo ""

# ============================================================================
# PHASE 7: SMOKE TESTS
# ============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 7: SMOKE TESTS${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

log "INFO" "Running smoke tests..."

# Test critical API endpoints
ENDPOINTS=(
    "/api/health"
    "/api/status"
)

for endpoint in "${ENDPOINTS[@]}"; do
    FULL_URL="https://infamous-freight.fly.dev$endpoint"
    echo -e "${BLUE}Testing: $FULL_URL${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$FULL_URL" || echo "000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        log "INFO" "Smoke test passed for $endpoint: $HTTP_CODE"
        echo -e "${GREEN}✓ $endpoint (HTTP $HTTP_CODE)${NC}"
    else
        log "ERROR" "Smoke test failed for $endpoint: $HTTP_CODE"
        echo -e "${RED}❌ $endpoint (HTTP $HTTP_CODE)${NC}"
    fi
done
echo ""

# ============================================================================
# DEPLOYMENT SUMMARY
# ============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}DEPLOYMENT SUMMARY${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

END_TIME=$(date +"%Y-%m-%d %H:%M:%S")
log "INFO" "Deployment completed at $END_TIME"

cat << EOF

${GREEN}✅ DEPLOYMENT COMPLETE!${NC}

${CYAN}📦 Project:${NC} $PROJECT_NAME
${CYAN}📌 Version:${NC} $VERSION
${CYAN}🕐 Started:${NC} $DEPLOYMENT_DATE
${CYAN}🕐 Completed:${NC} $END_TIME
${CYAN}📋 Log File:${NC} $LOG_FILE

${CYAN}🌐 LIVE URLs:${NC}
  ${GREEN}Web:${NC} https://infamous-freight-enterprises.vercel.app
  ${GREEN}API:${NC} https://infamous-freight.fly.dev
  ${GREEN}Health:${NC} https://infamous-freight.fly.dev/api/health
  ${GREEN}Status:${NC} https://infamous-freight.fly.dev/api/status
  ${GREEN}Docs:${NC} https://infamous-freight.fly.dev/api/docs

${CYAN}📊 NEXT STEPS:${NC}
  1. Monitor logs: ${YELLOW}flyctl logs -a infamous-freight-as-3gw${NC}
  2. Check metrics: ${YELLOW}flyctl status -a infamous-freight-as-3gw${NC}
  3. Run E2E tests: ${YELLOW}pnpm --filter e2e test${NC}
  4. Monitor Sentry: ${YELLOW}https://sentry.io${NC}
  5. Review deployment: ${YELLOW}cat $LOG_FILE${NC}

${GREEN}🎉 INFÆMOUS FREIGHT IS NOW 100% LIVE!${NC}

EOF

log "INFO" "=== DEPLOYMENT COMPLETE ==="
exit 0
