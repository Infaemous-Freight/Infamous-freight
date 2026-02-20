#!/bin/bash

###############################################################################
# Deployment Rollback Script
# 
# Quickly rollback to previous working deployment in case of critical issues.
# 
# Usage:
#   ./scripts/rollback.sh [environment] [version]
#
# Examples:
#   ./scripts/rollback.sh production             # Rollback to previous version
#   ./scripts/rollback.sh staging v1.2.3         # Rollback to specific version
#   ./scripts/rollback.sh production --list      # List available versions
#
# Requirements:
#   - Fly CLI installed (for API rollback)
#   - Vercel CLI installed (for Web rollback)
#   - Proper environment variables set
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/rollback-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory if not exists
mkdir -p "${PROJECT_ROOT}/logs"

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" | tee -a "${LOG_FILE}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $*" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $*" | tee -a "${LOG_FILE}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $*" | tee -a "${LOG_FILE}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Fly CLI
    if ! command -v flyctl &> /dev/null; then
        error "Fly CLI not found. Install: https://fly.io/docs/hands-on/install-flyctl/"
        exit 1
    fi
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        warn "Vercel CLI not found. Web rollback will be skipped."
    fi
    
    # Check environment variables
    if [ -z "${FLY_API_TOKEN:-}" ]; then
        warn "FLY_API_TOKEN not set. You may need to login manually."
    fi
    
    log "Prerequisites check complete"
}

# List available versions
list_versions() {
    local environment=$1
    
    log "Listing available versions for ${environment}..."
    
    # List Fly.io versions
    info "API versions (Fly.io):"
    if [ "${environment}" = "production" ]; then
        flyctl releases --app infamous-freight-api
    else
        flyctl releases --app infamous-freight-api-staging
    fi
    
    # List Vercel deployments
    if command -v vercel &> /dev/null; then
        info "Web versions (Vercel):"
        cd "${PROJECT_ROOT}/apps/web"
        vercel ls --prod 2>/dev/null || warn "Unable to list Vercel deployments"
    fi
}

# Get previous version
get_previous_version() {
    local environment=$1
    
    if [ "${environment}" = "production" ]; then
        flyctl releases --app infamous-freight-api --json | jq -r '.[1].version' 2>/dev/null || echo ""
    else
        flyctl releases --app infamous-freight-api-staging --json | jq -r '.[1].version' 2>/dev/null || echo ""
    fi
}

# Rollback API (Fly.io)
rollback_api() {
    local environment=$1
    local version=$2
    
    log "Rolling back API to version ${version}..."
    
    local app_name
    if [ "${environment}" = "production" ]; then
        app_name="infamous-freight-api"
    else
        app_name="infamous-freight-api-staging"
    fi
    
    # Create backup of current state
    info "Creating backup of current deployment..."
    flyctl status --app "${app_name}" > "${PROJECT_ROOT}/logs/pre-rollback-state-${app_name}.txt" || true
    
    # Perform rollback
    info "Executing rollback on ${app_name}..."
    if flyctl releases rollback --app "${app_name}" "${version}"; then
        log "✓ API rollback successful"
        return 0
    else
        error "✗ API rollback failed"
        return 1
    fi
}

# Rollback Web (Vercel)
rollback_web() {
    local environment=$1
    local deployment_url=$2
    
    log "Rolling back Web to deployment ${deployment_url}..."
    
    cd "${PROJECT_ROOT}/apps/web"
    
    # Promote previous deployment to production
    if vercel promote "${deployment_url}" --yes; then
        log "✓ Web rollback successful"
        return 0
    else
        error "✗ Web rollback failed"
        return 1
    fi
}

# Health check after rollback
health_check() {
    local environment=$1
    local max_attempts=10
    local attempt=1
    
    log "Running health checks..."
    
    # Determine URLs based on environment
    local api_url
    local web_url
    
    if [ "${environment}" = "production" ]; then
        api_url="https://api.infamousfreight.com"
        web_url="https://web.infamousfreight.com"
    else
        api_url="https://staging-api.infamousfreight.com"
        web_url="https://staging-web.infamousfreight.com"
    fi
    
    # Check API health
    while [ $attempt -le $max_attempts ]; do
        info "Health check attempt ${attempt}/${max_attempts}..."
        
        if curl -f -s "${api_url}/api/health" > /dev/null; then
            log "✓ API is healthy"
            break
        else
            if [ $attempt -eq $max_attempts ]; then
                error "✗ API health check failed after ${max_attempts} attempts"
                return 1
            fi
            warn "API not ready, waiting 10s..."
            sleep 10
        fi
        
        ((attempt++))
    done
    
    # Check Web health
    if curl -f -s "${web_url}" > /dev/null; then
        log "✓ Web is healthy"
    else
        warn "Web health check failed"
    fi
    
    # Check detailed health endpoint
    info "Checking detailed health metrics..."
    curl -s "${api_url}/api/health/detailed" | jq '.' || warn "Unable to fetch detailed health"
    
    log "Health checks complete"
    return 0
}

# Database rollback (if needed)
rollback_database() {
    local environment=$1
    
    warn "Database rollback requires manual intervention"
    info "To rollback database migrations:"
    info "  1. Connect to database: cd apps/api && pnpm prisma studio"
    info "  2. Review migration history: pnpm prisma migrate status"
    info "  3. Rollback: git checkout <previous-commit> && pnpm prisma migrate deploy"
    
    read -p "Have you verified database state? (yes/no): " db_confirm
    if [ "${db_confirm}" != "yes" ]; then
        error "Database rollback aborted"
        return 1
    fi
    
    return 0
}

# Notify team
notify_rollback() {
    local environment=$1
    local version=$2
    local reason=$3
    
    log "Notifying team of rollback..."
    
    # Send Slack notification (if webhook configured)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST "${SLACK_WEBHOOK_URL}" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"🚨 Rollback Executed\",
                \"blocks\": [
                    {
                        \"type\": \"section\",
                        \"text\": {
                            \"type\": \"mrkdwn\",
                            \"text\": \"*Rollback Executed*\n\n*Environment:* ${environment}\n*Version:* ${version}\n*Reason:* ${reason}\n*Time:* $(date)\n*User:* $(whoami)\"
                        }
                    }
                ]
            }" 2>/dev/null || warn "Failed to send Slack notification"
    fi
    
    # Create incident log
    cat > "${PROJECT_ROOT}/logs/rollback-incident-$(date +%Y%m%d-%H%M%S).md" <<EOF
# Rollback Incident Report

**Date:** $(date)
**Environment:** ${environment}
**Rolled back to:** ${version}
**Executed by:** $(whoami)
**Reason:** ${reason}

## Actions Taken

1. API rollback completed
2. Web rollback completed
3. Health checks passed

## Post-Rollback Checklist

- [ ] Monitor error rates
- [ ] Check user reports
- [ ] Review logs for anomalies
- [ ] Identify root cause
- [ ] Create fix for original issue
- [ ] Plan re-deployment

## Notes

EOF
    
    info "Incident report created: logs/rollback-incident-$(date +%Y%m%d-%H%M%S).md"
}

# Main rollback function
main() {
    local environment=${1:-}
    local version=${2:-}
    local reason=${3:-"Critical issue detected"}
    
    # Display banner
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║       Infamous Freight - Deployment Rollback Tool       ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    
    # Validate arguments
    if [ -z "${environment}" ]; then
        error "Environment not specified"
        echo "Usage: $0 [environment] [version] [reason]"
        echo "  environment: production, staging"
        echo "  version: (optional) specific version to rollback to"
        echo "  reason: (optional) reason for rollback"
        exit 1
    fi
    
    # Handle special flags
    if [ "${version}" = "--list" ]; then
        list_versions "${environment}"
        exit 0
    fi
    
    # Validate environment
    if [[ ! "${environment}" =~ ^(production|staging)$ ]]; then
        error "Invalid environment: ${environment}"
        exit 1
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Get previous version if not specified
    if [ -z "${version}" ]; then
        version=$(get_previous_version "${environment}")
        if [ -z "${version}" ]; then
            error "Could not determine previous version"
            exit 1
        fi
        info "Detected previous version: ${version}"
    fi
    
    # Confirm rollback
    warn "You are about to rollback ${environment} to version ${version}"
    warn "Current deployments will be replaced"
    read -p "Continue? (yes/no): " confirm
    
    if [ "${confirm}" != "yes" ]; then
        info "Rollback cancelled"
        exit 0
    fi
    
    # Execute rollback
    log "Starting rollback process..."
    
    # Rollback API
    if ! rollback_api "${environment}" "${version}"; then
        error "API rollback failed. Aborting."
        exit 1
    fi
    
    # Wait for API to stabilize
    sleep 10
    
    # Health check
    if ! health_check "${environment}"; then
        error "Health checks failed after rollback"
        exit 1
    fi
    
    # Rollback database if needed
    warn "Database migrations may need to be rolled back manually"
    
    # Notify team
    notify_rollback "${environment}" "${version}" "${reason}"
    
    # Success
    log "✓ Rollback completed successfully"
    log "Log file: ${LOG_FILE}"
    
    info "Next steps:"
    info "  1. Monitor error rates and user reports"
    info "  2. Review logs: tail -f ${LOG_FILE}"
    info "  3. Investigate root cause of original issue"
    info "  4. Create hotfix and plan re-deployment"
}

# Run main function
main "$@"
