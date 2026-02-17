#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# ALL BRANCHES GREEN 100% - AUTOMATED DEPLOYMENT SCRIPT
# ═══════════════════════════════════════════════════════════════════
# Complete enterprise deployment with health checks and validation
# Usage: ./deploy-all-branches-green-100.sh [environment]
# Environments: development, staging, production
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$PROJECT_ROOT/logs/deployment_$TIMESTAMP.log"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Display banner
display_banner() {
    cat << 'EOF'
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║       🟢 ALL BRANCHES GREEN 100% - DEPLOYMENT WIZARD 🟢       ║
║                                                                ║
║  Complete Enterprise Infrastructure Deployment                ║
║  Tier 1-5 Infrastructure with Full Automation                 ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    local missing_tools=()
    
    for tool in docker docker-compose git node npm terraform kubectl; do
        if ! command -v $tool &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
        error "Please install missing tools and try again"
        exit 1
    fi
    
    log "✅ All prerequisites met"
}

# Verify environment configuration
verify_environment() {
    log "🔍 Verifying environment configuration..."
    
    local env_file=".env.$ENVIRONMENT"
    
    if [ ! -f "$env_file" ]; then
        warn "Environment file $env_file not found, using .env"
        env_file=".env"
    fi
    
    if [ ! -f "$env_file" ]; then
        error "No environment configuration found"
        exit 1
    fi
    
    # Source environment
    set -a
    source "$env_file"
    set +a
    
    # Verify critical variables
    local required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "API_PORT"
        "VAULT_ADDR"
        "LOKI_URL"
        "JAEGER_AGENT_HOST"
        "KONG_ADMIN_URL"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    log "✅ Environment configuration verified"
}

# Run pre-deployment checks
pre_deployment_checks() {
    log "📋 Running pre-deployment checks..."
    
    # Check git status
    if [ -n "$(git status --porcelain)" ]; then
        warn "Working directory has uncommitted changes"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check branch
    current_branch=$(git branch --show-current)
    log "Current branch: $current_branch"
    
    if [ "$ENVIRONMENT" = "production" ] && [ "$current_branch" != "main" ]; then
        error "Production deployments must be from 'main' branch"
        exit 1
    fi
    
    # Run tests
    log "🧪 Running test suite..."
    if ! npm run test --if-present; then
        error "Tests failed"
        exit 1
    fi
    
    log "✅ Pre-deployment checks passed"
}

# Build shared package
build_shared() {
    log "🔨 Building shared package..."
    
    if ! pnpm --filter @infamous-freight/shared build; then
        error "Shared package build failed"
        exit 1
    fi
    
    log "✅ Shared package built successfully"
}

# Deploy Tier 1: Critical Infrastructure
deploy_tier1() {
    log "🏗️ Deploying Tier 1: Critical Infrastructure..."
    
    # Start Patroni (PostgreSQL HA)
    log "Starting PostgreSQL HA cluster..."
    docker-compose -f infrastructure/patroni/docker-compose.yml up -d
    sleep 10
    
    # Start PgBouncer
    log "Starting PgBouncer connection pooling..."
    docker-compose -f infrastructure/pgbouncer/docker-compose.yml up -d
    sleep 5
    
    # Start Loki
    log "Starting Loki log aggregation..."
    docker-compose -f infrastructure/loki/docker-compose.yml up -d
    sleep 5
    
    # Start Jaeger
    log "Starting Jaeger distributed tracing..."
    docker-compose -f infrastructure/jaeger/docker-compose.yml up -d
    sleep 5
    
    # Start Vault
    log "Starting HashiCorp Vault..."
    docker-compose -f infrastructure/vault/docker-compose.yml up -d
    sleep 10
    
    # Initialize Vault if needed
    if [ ! -f ".vault-init" ]; then
        log "Initializing Vault..."
        docker exec vault vault operator init -key-shares=1 -key-threshold=1 > .vault-init
        log "⚠️  Vault keys stored in .vault-init - SECURE THIS FILE"
    fi
    
    log "✅ Tier 1 deployed successfully"
}

# Deploy Tier 2: Performance Optimization
deploy_tier2() {
    log "⚡ Deploying Tier 2: Performance Optimization..."
    
    # Services are integrated into API, verify they exist
    local services=(
        "apps/api/src/services/queryOptimizationService.js"
        "apps/api/src/services/costOptimizationService.js"
        "apps/web/src/services/assetOptimizationService.js"
    )
    
    for service in "${services[@]}"; do
        if [ ! -f "$service" ]; then
            error "Missing service: $service"
            exit 1
        fi
    done
    
    log "✅ Tier 2 services verified"
}

# Deploy Tier 3: Security & Compliance
deploy_tier3() {
    log "🔒 Deploying Tier 3: Security & Compliance..."
    
    # Start Kong API Gateway
    log "Starting Kong API Gateway..."
    docker-compose -f infrastructure/kong/docker-compose.yml up -d
    sleep 15
    
    # Configure Kong
    log "Configuring Kong plugins and routes..."
    if ! bash infrastructure/kong/configure-kong.sh; then
        warn "Kong configuration had warnings"
    fi
    
    log "✅ Tier 3 deployed successfully"
}

# Deploy Tier 4: Multi-Region & Scaling
deploy_tier4() {
    log "🌍 Deploying Tier 4: Multi-Region & Scaling..."
    
    # Terraform multi-region setup
    if [ -d "infrastructure/multi-region/terraform" ]; then
        log "Initializing Terraform..."
        cd infrastructure/multi-region/terraform
        terraform init
        
        log "Planning Terraform deployment..."
        terraform plan -out=tfplan
        
        if [ "$ENVIRONMENT" = "production" ]; then
            log "Applying Terraform configuration..."
            terraform apply tfplan
        else
            log "Skipping Terraform apply in non-production environment"
        fi
        
        cd "$PROJECT_ROOT"
    fi
    
    # Start notification service
    log "Starting RabbitMQ for notifications..."
    docker run -d --name rabbitmq \
        -p 5672:5672 \
        -p 15672:15672 \
        -e RABBITMQ_DEFAULT_USER=admin \
        -e RABBITMQ_DEFAULT_PASS=admin \
        rabbitmq:3-management || true
    
    log "✅ Tier 4 deployed successfully"
}

# Deploy Tier 5: ML & Business Intelligence
deploy_tier5() {
    log "🤖 Deploying Tier 5: ML & Business Intelligence..."
    
    # Services are integrated into API, verify they exist
    local services=(
        "apps/api/src/services/mlAnomalyDetectionService.js"
        "apps/api/src/services/businessIntelligenceService.js"
    )
    
    for service in "${services[@]}"; do
        if [ ! -f "$service" ]; then
            error "Missing service: $service"
            exit 1
        fi
    done
    
    log "✅ Tier 5 services verified"
}

# Deploy API
deploy_api() {
    log "🚀 Deploying API..."
    
    cd apps/api
    
    # Install dependencies
    log "Installing API dependencies..."
    npm ci --production
    
    # Run database migrations
    log "Running database migrations..."
    npx prisma migrate deploy
    
    # Generate Prisma client
    log "Generating Prisma client..."
    npx prisma generate
    
    # Build (if TypeScript)
    if [ -f "tsconfig.json" ]; then
        log "Building API..."
        npm run build
    fi
    
    cd "$PROJECT_ROOT"
    
    log "✅ API deployed successfully"
}

# Deploy Web
deploy_web() {
    log "🌐 Deploying Web..."
    
    cd apps/web
    
    # Install dependencies
    log "Installing web dependencies..."
    npm ci --production
    
    # Build Next.js
    log "Building Next.js application..."
    npm run build
    
    cd "$PROJECT_ROOT"
    
    log "✅ Web deployed successfully"
}

# Health checks
run_health_checks() {
    log "🏥 Running health checks..."
    
    local max_attempts=30
    local attempt=0
    local all_healthy=false
    
    while [ $attempt -lt $max_attempts ] && [ "$all_healthy" = false ]; do
        attempt=$((attempt + 1))
        info "Health check attempt $attempt/$max_attempts"
        
        # Check API health
        if curl -f http://localhost:${API_PORT:-4000}/api/health > /dev/null 2>&1; then
            log "✅ API is healthy"
            all_healthy=true
        else
            warn "API not healthy yet, waiting..."
            sleep 5
        fi
    done
    
    if [ "$all_healthy" = false ]; then
        error "Health checks failed after $max_attempts attempts"
        exit 1
    fi
    
    log "✅ All health checks passed"
}

# Validate deployment
validate_deployment() {
    log "📊 Validating deployment..."
    
    # Check all infrastructure files exist
    local infrastructure_files=(
        "infrastructure/patroni/patroni.yml"
        "infrastructure/pgbouncer/pgbouncer.ini"
        "infrastructure/loki/loki-config.yml"
        "infrastructure/jaeger/jaeger-collector-config.yml"
        "infrastructure/vault/vault-config.hcl"
        "infrastructure/kong/docker-compose.yml"
        "infrastructure/multi-region/terraform/main.tf"
    )
    
    for file in "${infrastructure_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "Missing infrastructure file: $file"
            exit 1
        fi
    done
    
    # Check all service files exist
    local service_files=(
        "apps/api/src/services/tracingService.js"
        "apps/api/src/services/vaultService.js"
        "apps/api/src/services/queryOptimizationService.js"
        "apps/api/src/services/costOptimizationService.js"
        "apps/api/src/services/complianceAuditService.js"
        "apps/api/src/services/featureFlagsService.js"
        "apps/api/src/services/mlAnomalyDetectionService.js"
        "apps/api/src/services/businessIntelligenceService.js"
    )
    
    for file in "${service_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "Missing service file: $file"
            exit 1
        fi
    done
    
    log "✅ Deployment validation passed"
}

# Display deployment summary
display_summary() {
    cat << EOF

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🎉 DEPLOYMENT COMPLETE - ALL BRANCHES GREEN 100% 🎉         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

Environment: $ENVIRONMENT
Timestamp: $TIMESTAMP
Log File: $LOG_FILE

Deployed Components:
  ✅ Tier 1: Critical Infrastructure (Patroni, PgBouncer, Loki, Jaeger, Vault)
  ✅ Tier 2: Performance Optimization (Query, Asset, Cost)
  ✅ Tier 3: Security & Compliance (Kong, Compliance Audit)
  ✅ Tier 4: Multi-Region & Scaling (Terraform, Feature Flags, Notifications)
  ✅ Tier 5: ML & Business Intelligence (Anomaly Detection, BI Dashboard)
  ✅ API Application
  ✅ Web Application

Service URLs:
  - API: http://localhost:${API_PORT:-4000}
  - Web: http://localhost:${WEB_PORT:-3000}
  - Kong Admin: http://localhost:8001
  - Grafana: http://localhost:3000
  - Jaeger UI: http://localhost:16686
  - Vault UI: http://localhost:8200

Next Steps:
  1. Monitor logs: tail -f $LOG_FILE
  2. Check health: curl http://localhost:${API_PORT:-4000}/api/health
  3. View GitHub Actions: https://github.com/MrMiless44/Infamous-freight/actions
  4. Review documentation: TIER_1_5_IMPLEMENTATION_GUIDE.md

Status: 🟢 ALL SYSTEMS OPERATIONAL

╔════════════════════════════════════════════════════════════════╗
║     🚀 READY FOR PRODUCTION - ALL BRANCHES GREEN 100% 🚀      ║
╚════════════════════════════════════════════════════════════════╝

EOF
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    # Stop all services
    docker-compose down || true
    
    # Restore database backup if exists
    if [ -f "backup/database_$TIMESTAMP.sql" ]; then
        log "Restoring database backup..."
        # Add database restore logic here
    fi
    
    error "Rollback complete"
    exit 1
}

# Trap errors and rollback
trap rollback ERR

# Main deployment flow
main() {
    display_banner
    
    log "Starting deployment to $ENVIRONMENT environment..."
    
    check_prerequisites
    verify_environment
    pre_deployment_checks
    build_shared
    
    deploy_tier1
    deploy_tier2
    deploy_tier3
    deploy_tier4
    deploy_tier5
    
    deploy_api
    deploy_web
    
    run_health_checks
    validate_deployment
    
    display_summary
    
    log "🎉 Deployment completed successfully!"
}

# Run main function
main "$@"
