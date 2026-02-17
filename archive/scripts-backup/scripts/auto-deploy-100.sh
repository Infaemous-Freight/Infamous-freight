#!/bin/bash

#############################################################################
# AUTO DEPLOY 100% - Orchestrated Deployment System
# 
# This script orchestrates the complete deployment of the Infamous Freight
# application stack with automatic detection of changes, quality checks,
# and staged deployments.
#
# Usage:
#   ./scripts/auto-deploy-100.sh [options]
#
# Options:
#   --environment [production|staging]  Target environment (default: production)
#   --skip-tests                        Skip quality checks
#   --deploy-all                        Force deploy all services
#   --dry-run                           Show what would be deployed
#   --help                              Show this help message
#############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
SKIP_TESTS=false
DEPLOY_ALL=false
DRY_RUN=false
TIMESTAMP=$(date +%s)
LOG_FILE="deployment-${TIMESTAMP}.log"

# Deployment tracking
DEPLOYED_SERVICES=()
SKIPPED_SERVICES=()
FAILED_SERVICES=()

# Functions
log() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

header() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}$1${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --deploy-all)
                DEPLOY_ALL=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    grep '^#' "$0" | grep -v '#!/bin/bash' | sed 's/^# //'
}

# Stage 1: Pre-flight checks
preflight() {
    header "Stage 1: Pre-Flight Checks"
    
    log "Checking prerequisites..."
    
    # Check for required tools
    local required_tools=(git pnpm node)
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool is not installed"
            return 1
        fi
    done
    success "All required tools found"
    
    # Check git status
    if [[ -n $(git status -s) ]]; then
        warning "Uncommitted changes detected"
        log "Stashing changes..."
        git stash push -m "auto-deploy-backup-${TIMESTAMP}"
    fi
    
    # Verify we're on main branch
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$current_branch" != "main" ]]; then
        warning "Not on main branch (current: $current_branch)"
    fi
    
    success "Pre-flight checks passed"
}

# Stage 2: Detect changes
detect_changes() {
    header "Stage 2: Detect Changes"
    
    local api_changed=false
    local web_changed=false
    local mobile_changed=false
    local shared_changed=false
    
    if [[ "$DEPLOY_ALL" == true ]]; then
        log "Force deploy all services enabled"
        api_changed=true
        web_changed=true
        mobile_changed=true
        shared_changed=true
    else
        # Check for changes in the last commit
        local last_commit=$(git diff --name-only HEAD~1..HEAD 2>/dev/null || git diff --name-only HEAD)
        
        [[ $last_commit =~ apps/api/ ]] && api_changed=true
        [[ $last_commit =~ apps/web/ ]] && web_changed=true
        [[ $last_commit =~ apps/mobile/ ]] && mobile_changed=true
        [[ $last_commit =~ packages/shared/ ]] && shared_changed=true
    fi
    
    # Log results
    echo "" | tee -a "$LOG_FILE"
    log "API:     $([ $api_changed = true ] && echo '✅ Changed' || echo '⏭️  Unchanged')"
    log "Web:     $([ $web_changed = true ] && echo '✅ Changed' || echo '⏭️  Unchanged')"
    log "Mobile:  $([ $mobile_changed = true ] && echo '✅ Changed' || echo '⏭️  Unchanged')"
    log "Shared:  $([ $shared_changed = true ] && echo '✅ Changed' || echo '⏭️  Unchanged')"
    
    # Export for later stages
    export API_CHANGED=$api_changed
    export WEB_CHANGED=$web_changed
    export MOBILE_CHANGED=$mobile_changed
    export SHARED_CHANGED=$shared_changed
}

# Stage 3: Quality checks
verify_quality() {
    if [[ "$SKIP_TESTS" == true ]]; then
        warning "Skipping quality checks (--skip-tests enabled)"
        return 0
    fi
    
    header "Stage 3: Quality Checks"
    
    log "Installing dependencies..."
    pnpm install --frozen-lockfile 2>&1 | tee -a "$LOG_FILE"
    
    log "Building shared package..."
    pnpm --filter @infamous-freight/shared build 2>&1 | tee -a "$LOG_FILE"
    
    log "Running linter..."
    if pnpm lint 2>&1 | tee -a "$LOG_FILE"; then
        success "Lint passed"
    else
        error "Lint failed"
        return 1
    fi
    
    log "Running type checks..."
    if pnpm check:types 2>&1 | tee -a "$LOG_FILE"; then
        success "Type checks passed"
    else
        error "Type checks failed"
        return 1
    fi
    
    if [[ "$API_CHANGED" == true ]]; then
        log "Running API tests..."
        if pnpm --filter api test 2>&1 | tee -a "$LOG_FILE"; then
            success "API tests passed"
        else
            error "API tests failed"
            return 1
        fi
    fi
    
    success "Quality checks completed"
}

# Stage 4: Build services
build_services() {
    header "Stage 4: Build Services"
    
    if [[ "$API_CHANGED" == true ]]; then
        log "Building API..."
        if pnpm --filter api build 2>&1 | tee -a "$LOG_FILE"; then
            success "API build completed"
        else
            error "API build failed"
            FAILED_SERVICES+=("api")
            return 1
        fi
    fi
    
    if [[ "$WEB_CHANGED" == true ]]; then
        log "Building Web..."
        if pnpm --filter web build 2>&1 | tee -a "$LOG_FILE"; then
            success "Web build completed"
        else
            error "Web build failed"
            FAILED_SERVICES+=("web")
            return 1
        fi
    fi
    
    if [[ "$SHARED_CHANGED" == true ]]; then
        log "Building Shared package..."
        if pnpm --filter @infamous-freight/shared build 2>&1 | tee -a "$LOG_FILE"; then
            success "Shared package build completed"
        else
            error "Shared package build failed"
            return 1
        fi
    fi
}

# Stage 5: Deploy to environments
deploy() {
    header "Stage 5: Deployment"
    
    if [[ "$DRY_RUN" == true ]]; then
        warning "DRY RUN MODE - No actual deployments will occur"
    fi
    
    # Deploy API
    if [[ "$API_CHANGED" == true ]]; then
        log "Deploying API to $ENVIRONMENT..."
        if [[ "$DRY_RUN" == false ]]; then
            if deploy_api; then
                success "API deployed successfully"
                DEPLOYED_SERVICES+=("api")
            else
                error "API deployment failed"
                FAILED_SERVICES+=("api")
            fi
        else
            log "Would deploy: API to Fly.io ($ENVIRONMENT)"
            DEPLOYED_SERVICES+=("api")
        fi
    else
        SKIPPED_SERVICES+=("api")
    fi
    
    # Deploy Web
    if [[ "$WEB_CHANGED" == true ]]; then
        log "Deploying Web to $ENVIRONMENT..."
        if [[ "$DRY_RUN" == false ]]; then
            if deploy_web; then
                success "Web deployed successfully"
                DEPLOYED_SERVICES+=("web")
            else
                error "Web deployment failed"
                FAILED_SERVICES+=("web")
            fi
        else
            log "Would deploy: Web to Vercel ($ENVIRONMENT)"
            DEPLOYED_SERVICES+=("web")
        fi
    else
        SKIPPED_SERVICES+=("web")
    fi
}

# Helper: Deploy API
deploy_api() {
    # Check for Fly.io token
    if [[ -z "$FLY_API_TOKEN" ]]; then
        warning "FLY_API_TOKEN not set, skipping API deployment"
        SKIPPED_SERVICES+=("api")
        return 0
    fi
    
    # Deploy using flyctl
    if command -v flyctl &> /dev/null; then
        cd apps/api || return 1
        flyctl deploy --remote-only --build-arg NODE_ENV="$ENVIRONMENT" 2>&1 | tee -a "$LOG_FILE"
        cd - || return 1
    else
        warning "flyctl not found, cannot deploy API"
        return 1
    fi
}

# Helper: Deploy Web
deploy_web() {
    # Check for Vercel token
    if [[ -z "$VERCEL_TOKEN" ]]; then
        warning "VERCEL_TOKEN not set, skipping Web deployment"
        SKIPPED_SERVICES+=("web")
        return 0
    fi
    
    # Deploy using vercel CLI
    if command -v vercel &> /dev/null; then
        vercel deploy --prod --token="$VERCEL_TOKEN" \
            --build-env=NODE_ENV="$ENVIRONMENT" \
            --build-env=API_URL=https://infamous-freight-api.fly.dev 2>&1 | tee -a "$LOG_FILE"
    else
        warning "vercel CLI not found, cannot deploy Web"
        return 1
    fi
}

# Stage 6: Smoke tests
smoke_tests() {
    header "Stage 6: Smoke Tests"
    
    if [[ ${#DEPLOYED_SERVICES[@]} -eq 0 ]]; then
        warning "No services deployed, skipping smoke tests"
        return 0
    fi
    
    if [[ "$API_CHANGED" == true ]] && [[ " ${DEPLOYED_SERVICES[@]} " =~ " api " ]]; then
        log "Testing API health..."
        for i in {1..5}; do
            if curl -sf https://infamous-freight-api.fly.dev/api/health > /dev/null 2>&1; then
                success "API health check passed"
                break
            fi
            if [[ $i -lt 5 ]]; then
                log "Retry $i/5, waiting 5 seconds..."
                sleep 5
            fi
        done
    fi
    
    if [[ "$WEB_CHANGED" == true ]] && [[ " ${DEPLOYED_SERVICES[@]} " =~ " web " ]]; then
        log "Testing Web deployment..."
        if curl -sf https://infamous-freight-enterprises.vercel.app > /dev/null 2>&1; then
            success "Web deployment verified"
        fi
    fi
}

# Final summary
summary() {
    header "Deployment Summary"
    
    echo "" | tee -a "$LOG_FILE"
    
    if [[ ${#DEPLOYED_SERVICES[@]} -gt 0 ]]; then
        log "✅ Successfully deployed: ${DEPLOYED_SERVICES[*]}"
    fi
    
    if [[ ${#SKIPPED_SERVICES[@]} -gt 0 ]]; then
        log "⏭️  Skipped: ${SKIPPED_SERVICES[*]}"
    fi
    
    if [[ ${#FAILED_SERVICES[@]} -gt 0 ]]; then
        error "❌ Failed: ${FAILED_SERVICES[*]}"
        echo "" | tee -a "$LOG_FILE"
        echo "📋 Full logs: $LOG_FILE" | tee -a "$LOG_FILE"
        return 1
    fi
    
    echo "" | tee -a "$LOG_FILE"
    echo -e "${GREEN}═════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}🎉 Auto Deploy 100% - Completed Successfully!${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}═════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    echo "🌐 Web:  https://infamous-freight-enterprises.vercel.app" | tee -a "$LOG_FILE"
    echo "🔌 API:  https://infamous-freight-api.fly.dev" | tee -a "$LOG_FILE"
    echo "📋 Logs: $LOG_FILE" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

# Main execution
main() {
    parse_args "$@"
    
    header "🚀 AUTO DEPLOY 100% - Orchestrated Deployment System"
    log "Environment: $ENVIRONMENT"
    log "Skip Tests: $SKIP_TESTS"
    log "Deploy All: $DEPLOY_ALL"
    log "Dry Run: $DRY_RUN"
    log "Log File: $LOG_FILE"
    
    # Execute stages
    preflight || exit 1
    detect_changes
    
    if ! verify_quality; then
        error "Quality checks failed"
        summary
        exit 1
    fi
    
    if ! build_services; then
        error "Build failed"
        summary
        exit 1
    fi
    
    deploy
    smoke_tests
    summary
}

# Execute main if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
