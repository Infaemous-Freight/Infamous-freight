#!/bin/bash
# 🚀 PRODUCTION DEPLOYMENT SCRIPT
# Deploy to all platforms: Vercel (Web), Fly.io (API), Docker (Self-hosted)
# Usage: ./deploy-production.sh [vercel|fly|docker|all]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="production"
VERCEL_PROJECT="infamous-freight-enterprises"
FLY_APP="infamous-freight-api"
DOCKER_REGISTRY="ghcr.io"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check required tools
    for cmd in git pnpm; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd not found"
            exit 1
        fi
    done
    
    log_success "All dependencies present"
}

verify_tests() {
    log_info "Running tests..."
    cd /workspaces/Infamous-freight-enterprises
    pnpm test
    log_success "All tests passed"
}

verify_coverage() {
    log_info "Checking code coverage..."
    cd /workspaces/Infamous-freight-enterprises
    pnpm test:coverage
    log_success "Coverage thresholds met"
}

verify_types() {
    log_info "Type checking..."
    cd /workspaces/Infamous-freight-enterprises
    pnpm typecheck
    log_success "Type checking passed"
}

deploy_vercel() {
    log_info "Deploying Web to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI not installed. Install with: pnpm add -g vercel@latest"
        return 1
    fi
    
    cd /workspaces/Infamous-freight-enterprises/web
    vercel --prod
    log_success "Web deployed to Vercel"
}

deploy_fly() {
    log_info "Deploying API to Fly.io..."
    
    if ! command -v fly &> /dev/null; then
        log_error "Fly CLI not installed. Install with: curl -L https://fly.io/install.sh | sh"
        return 1
    fi
    
    cd /workspaces/Infamous-freight-enterprises
    fly deploy -c fly.api.toml
    log_success "API deployed to Fly.io"
}

deploy_docker() {
    log_info "Building Docker images..."
    
    cd /workspaces/Infamous-freight-enterprises
    
    # Build images
    docker-compose -f docker-compose.prod.yml build
    
    log_info "Pushing to registry..."
    docker-compose -f docker-compose.prod.yml push
    
    log_success "Docker images built and pushed"
}

run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # Wait for services
    sleep 5
    
    # Test health endpoints
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "API health check passed"
    else
        log_error "API health check failed"
        return 1
    fi
    
    log_success "Smoke tests passed"
}

main() {
    local target="${1:-all}"
    
    log_info "🚀 Starting Production Deployment"
    log_info "Target: $target"
    log_info "Environment: $DEPLOYMENT_ENV"
    
    # Pre-deployment checks
    check_dependencies
    verify_tests
    verify_coverage
    verify_types
    
    log_success "Pre-deployment checks passed"
    
    # Deploy
    case $target in
        vercel)
            deploy_vercel
            ;;
        fly)
            deploy_fly
            ;;
        docker)
            deploy_docker
            ;;
        all)
            deploy_vercel
            deploy_fly
            deploy_docker
            ;;
        *)
            log_error "Unknown target: $target"
            echo "Usage: $0 [vercel|fly|docker|all]"
            exit 1
            ;;
    esac
    
    log_success "✨ Production deployment complete!"
    log_info "🌐 Web: https://infamous-freight-enterprises.vercel.app"
    log_info "🔌 API: https://infamous-freight-api.fly.dev"
    log_info "📱 Mobile: https://expo.dev/@infamous-freight/mobile"
}

main "$@"
