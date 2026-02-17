#!/bin/bash

# Phase 1 Deployment Setup Script
# Automates complete Phase 1 deployment infrastructure setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Phase 1 Setup
setup_phase_1() {
  log_info "Starting Phase 1 Deployment Setup..."
  
  # Step 1: Verify prerequisites
  log_info "Step 1: Verifying prerequisites..."
  check_prerequisites
  
  # Step 2: Environment configuration
  log_info "Step 2: Setting up environment configuration..."
  setup_environment
  
  # Step 3: Directory structure
  log_info "Step 3: Creating directory structure..."
  create_directories
  
  # Step 4: Build services
  log_info "Step 4: Building services..."
  build_services
  
  # Step 5: Database initialization
  log_info "Step 5: Initializing database..."
  init_database
  
  # Step 6: Monitoring stack
  log_info "Step 6: Setting up monitoring..."
  setup_monitoring
  
  # Step 7: Deploy core services
  log_info "Step 7: Deploying core services..."
  deploy_services
  
  # Step 8: Health checks
  log_info "Step 8: Running health checks..."
  health_checks
  
  # Step 9: Smoke tests
  log_info "Step 9: Running smoke tests..."
  smoke_tests
  
  # Step 10: Backup
  log_info "Step 10: Creating backup..."
  create_backup
  
  log_info "Phase 1 Setup COMPLETE!"
}

check_prerequisites() {
  # Check Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js not found. Please install Node.js v18+"
    exit 1
  fi
  NODE_VERSION=$(node --version)
  log_info "Node.js version: $NODE_VERSION"
  
  # Check pnpm
  if ! command -v pnpm &> /dev/null; then
    log_error "pnpm not found. Please install pnpm"
    exit 1
  fi
  PNPM_VERSION=$(pnpm --version)
  log_info "pnpm version: $PNPM_VERSION"
  
  # Check Docker
  if ! command -v docker &> /dev/null; then
    log_error "Docker not found. Please install Docker"
    exit 1
  fi
  DOCKER_VERSION=$(docker --version)
  log_info "Docker version: $DOCKER_VERSION"
  
  # Check Docker Compose
  if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose not found. Please install Docker Compose"
    exit 1
  fi
  COMPOSE_VERSION=$(docker-compose --version)
  log_info "Docker Compose version: $COMPOSE_VERSION"
}

setup_environment() {
  if [ ! -f .env.production ]; then
    log_info "Creating .env.production..."
    cat > .env.production << 'EOF'
NODE_ENV=production
API_PORT=3001
WEB_PORT=3000
LOG_LEVEL=info

DATABASE_URL=postgresql://postgres:change_me_password@postgres:5432/infamous_freight
POSTGRES_DB=infamous_freight
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me_password

REDIS_URL=redis://redis:6379
REDIS_PASSWORD=change_me_redis_password

JWT_SECRET=change_me_jwt_secret_very_long_random_string
JWT_EXPIRES_IN=24h
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

AI_PROVIDER=synthetic
PROMETHEUS_PORT=9090
GRAFANA_PORT=3002
GRAFANA_PASSWORD=admin

JAEGER_AGENT_HOST=jaeger
JAEGER_AGENT_PORT=6831

VOICE_MAX_FILE_SIZE_MB=10

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
EOF
    log_warning "Created .env.production with defaults. Please update passwords and secrets!"
  else
    log_info ".env.production already exists"
  fi
}

create_directories() {
  mkdir -p nginx/ssl
  mkdir -p scripts/backups
  mkdir -p logs
  mkdir -p monitoring/prometheus
  mkdir -p monitoring/grafana
  log_info "Created all required directories"
}

build_services() {
  log_info "Building shared package..."
  pnpm --filter @infamous-freight/shared build
  
  log_info "Building API..."
  cd apps/api && pnpm build && cd ..
  
  log_info "Building Web..."
  cd apps/web && pnpm build && cd ..
  
  log_info "All services built successfully"
}

init_database() {
  log_info "Starting PostgreSQL and Redis..."
  docker-compose -f docker-compose.production.yml up -d postgres redis
  
  log_info "Waiting for PostgreSQL to be ready..."
  sleep 10
  
  log_info "Verifying database..."
  docker-compose -f docker-compose.production.yml exec -T postgres \
    psql -U postgres -d infamous_freight -c "SELECT version();" || log_error "Failed to connect to database"
  
  log_info "Database initialized"
}

setup_monitoring() {
  log_info "Starting monitoring services..."
  docker-compose -f docker-compose.production.yml up -d prometheus grafana jaeger
  
  sleep 15
  
  log_info "Verifying Prometheus..."
  curl -s http://localhost:9090/metrics > /dev/null && log_info "Prometheus is running" || log_error "Prometheus verification failed"
  
  log_info "Verifying Grafana..."
  curl -s http://localhost:3002 > /dev/null && log_info "Grafana is running" || log_error "Grafana verification failed"
}

deploy_services() {
  log_info "Deploying all services..."
  docker-compose -f docker-compose.production.yml up -d
  
  sleep 10
  
  log_info "Verifying services..."
  SERVICES=$(docker-compose -f docker-compose.production.yml ps)
  echo "$SERVICES"
  
  RUNNING_COUNT=$(echo "$SERVICES" | grep "Up" | wc -l)
  EXPECTED_COUNT=8  # nginx, postgres, redis, api, web, prometheus, grafana, jaeger
  
  if [ "$RUNNING_COUNT" -ge "$EXPECTED_COUNT" ]; then
    log_info "All services deployed successfully ($RUNNING_COUNT running)"
  else
    log_error "Not all services running. Expected $EXPECTED_COUNT, got $RUNNING_COUNT"
  fi
}

health_checks() {
  log_info "Running health checks..."
  
  # API health
  if curl -s http://localhost:3001/api/health | grep -q "ok"; then
    log_info "✓ API health check passed"
  else
    log_error "✗ API health check failed"
  fi
  
  # Web health
  if curl -s http://localhost:3000 > /dev/null; then
    log_info "✓ Web health check passed"
  else
    log_error "✗ Web health check failed"
  fi
  
  # Redis ping
  if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping | grep -q PONG; then
    log_info "✓ Redis health check passed"
  else
    log_error "✗ Redis health check failed"
  fi
}

smoke_tests() {
  log_info "Running smoke tests..."
  
  if [ -f "package.json" ] && grep -q "\"test:smoke\"" package.json; then
    pnpm run test:smoke || log_warning "Smoke tests failed or not configured"
  else
    log_warning "No smoke tests configured"
  fi
}

create_backup() {
  log_info "Creating backup..."
  if [ -f "scripts/backup-database.sh" ]; then
    bash scripts/backup-database.sh || log_warning "Backup creation had issues"
  else
    log_warning "Backup script not found"
  fi
}

# Run setup
setup_phase_1

# Final status
echo ""
log_info "=========================================="
log_info "Phase 1 Deployment Setup Complete!"
log_info "=========================================="
log_info "Next steps:"
log_info "1. Review .env.production and update secrets"
log_info "2. Monitor services with: docker-compose -f docker-compose.production.yml logs -f"
log_info "3. Access dashboards:"
log_info "   - Grafana: http://localhost:3002"
log_info "   - Prometheus: http://localhost:9090"
log_info "   - Jaeger: http://localhost:16686"
log_info "4. Run Phase 1 monitoring for 24 hours"
log_info "5. After 24h, verify success criteria and proceed to Phase 2"
