#!/bin/bash
#
# Secret Rotation Script
# Rotates JWT secrets and other credentials monthly
# Usage: ./scripts/rotate-secrets.sh [--dry-run]
#

set -e

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 DRY RUN MODE - No changes will be made"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
  echo -e "${GREEN}✅${NC} $1"
}

warn() {
  echo -e "${YELLOW}⚠️${NC}  $1"
}

error() {
  echo -e "${RED}❌${NC} $1"
}

# Check required tools
check_requirements() {
  log "Checking requirements..."
  
  if ! command -v flyctl &> /dev/null; then
    error "flyctl CLI not found. Install: https://fly.io/docs/flyctl/installing/"
    exit 1
  fi
  
  if ! command -v openssl &> /dev/null; then
    error "openssl not found"
    exit 1
  fi
  
  log "All requirements met"
}

# Generate secure random string
generate_secret() {
  openssl rand -base64 32
}

# Rotate JWT secret
rotate_jwt_secret() {
  log "Rotating JWT secret..."
  
  NEW_JWT_SECRET=$(generate_secret)
  
  if [[ "$DRY_RUN" == true ]]; then
    warn "Would set JWT_SECRET to: ${NEW_JWT_SECRET:0:10}..."
  else
    flyctl secrets set JWT_SECRET="$NEW_JWT_SECRET" --app infamous-freight-api
    log "JWT secret rotated successfully"
  fi
}

# Rotate database password (if using Fly Postgres)
rotate_database_password() {
  warn "Database password rotation requires manual intervention"
  warn "Steps:"
  warn "  1. Connect to Postgres: flyctl postgres connect -a infamous-freight-db"
  warn "  2. Run: ALTER USER infamous WITH PASSWORD 'new_password';"
  warn "  3. Update DATABASE_URL secret in API app"
}

# Rotate Redis password
rotate_redis_password() {
  log "Rotating Redis password..."
  
  NEW_REDIS_PASSWORD=$(generate_secret | tr -d '=')
  
  if [[ "$DRY_RUN" == true ]]; then
    warn "Would set REDIS_PASSWORD to: ${NEW_REDIS_PASSWORD:0:10}..."
  else
    # Update in docker-compose or managed Redis
    warn "Redis password should be updated in:"
    warn "  - docker-compose.yml"
    warn "  - Managed Redis dashboard (if applicable)"
    warn "  - REDIS_URL secret in Fly.io: flyctl secrets set REDIS_URL=\"redis://:$NEW_REDIS_PASSWORD@...\""
  fi
}

# Log rotation event
log_rotation() {
  local secret_name=$1
  local log_file="./logs/security-audit.log"
  
  mkdir -p ./logs
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Secret rotated: $secret_name" >> "$log_file"
  log "Logged rotation to $log_file"
}

# Main rotation workflow
main() {
  echo "🔐 Infamous Freight - Secret Rotation Script"
  echo "============================================"
  echo ""
  
  check_requirements
  
  echo ""
  log "Starting secret rotation..."
  echo ""
  
  # JWT Secret
  rotate_jwt_secret
  log_rotation "JWT_SECRET"
  
  echo ""
  
  # Database Password
  echo "⚙️  Database Password:"
  rotate_database_password
  
  echo ""
  
  # Redis Password
  echo "⚙️  Redis Password:"
  rotate_redis_password
  
  echo ""
  echo "============================================"
  log "Secret rotation complete!"
  echo ""
  
  if [[ "$DRY_RUN" != true ]]; then
    warn "Important: Verify all services are still operational"
    warn "Run: ./scripts/check-deployments.sh"
  fi
}

# Run main function
main
