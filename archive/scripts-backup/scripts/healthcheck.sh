#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Production Health Check and Monitoring Script
# 
# Performs comprehensive health checks on all services
# Usage: ./healthcheck.sh [--interval 60] [--alert email@example.com]

set -euo pipefail

INTERVAL="${INTERVAL:-30}"
ALERT_EMAIL="${ALERT_EMAIL:-}"
API_URL="${API_URL:-http://api:4000}"
WEB_URL="${WEB_URL:-http://web:3000}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-${API_URL}/api/health/details}"
API_HEALTH_URL="${API_HEALTH_URL:-${API_URL}/api/health}"
WEB_HEALTH_URL="${WEB_HEALTH_URL:-${WEB_URL}}"
DB_CONTAINER="${DB_CONTAINER:-infamous-postgres-prod}"
REDIS_CONTAINER="${REDIS_CONTAINER:-infamous-redis-prod}"
MAX_RETRIES=3
RETRY_DELAY=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log file
LOG_DIR="${LOG_DIR:-/var/log/infamous}"
if ! mkdir -p "$LOG_DIR" 2>/dev/null; then
  LOG_DIR="/tmp/infamous"
  mkdir -p "$LOG_DIR"
fi
LOG_FILE="${LOG_DIR}/health-check.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

check_service() {
  local service=$1
  local endpoint=$2
  local retries=0
  
  while [ $retries -lt $MAX_RETRIES ]; do
    if curl -sf "$endpoint" > /dev/null 2>&1; then
      echo -e "${GREEN}✓${NC} $service is healthy"
      return 0
    fi
    retries=$((retries + 1))
    if [ $retries -lt $MAX_RETRIES ]; then
      sleep $RETRY_DELAY
    fi
  done
  
  echo -e "${RED}✗${NC} $service is unhealthy"
  return 1
}

check_database() {
  log "Checking PostgreSQL..."
  if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️${NC} Docker not found, skipping database check"
    return 0
  fi
  if docker exec "$DB_CONTAINER" pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL is healthy"
    return 0
  else
    echo -e "${RED}✗${NC} PostgreSQL is unhealthy"
    return 1
  fi
}

check_redis() {
  log "Checking Redis..."
  if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️${NC} Docker not found, skipping Redis check"
    return 0
  fi
  if docker exec "$REDIS_CONTAINER" redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis is healthy"
    return 0
  else
    echo -e "${RED}✗${NC} Redis is unhealthy"
    return 1
  fi
}

check_api() {
  log "Checking API..."
  check_service "API" "$API_HEALTH_URL"
}

check_web() {
  log "Checking Web..."
  check_service "Web" "$WEB_HEALTH_URL"
}

get_metrics() {
  log "Collecting metrics..."
  
  local response=$(curl -s "$HEALTH_ENDPOINT" 2>/dev/null || echo "{}")
  
  echo "$response" | jq -r '.data | "\(.process.memory.rss) \(.system.uptime)"' 2>/dev/null || echo "0 0"
}

alert() {
  local subject=$1
  local message=$2
  
  if [ -z "$ALERT_EMAIL" ]; then
    return
  fi
  
  log "⚠️  Sending alert: $subject"
  
  # Example using mail (requires postfix or similar)
  # echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
  
  # Or using curl with email service
  # curl -X POST https://api.sendgrid.com/v3/mail/send \
  #   -H "Authorization: Bearer $SENDGRID_API_KEY" \
  #   -H "Content-Type: application/json" \
  #   -d "{...}"
}

continuous_monitoring() {
  log "Starting continuous health monitoring (interval: ${INTERVAL}s)"
  
  while true; do
    echo ""
    log "═══════════════════════════════════════"
    log "Health Check - $(date)"
    log "═══════════════════════════════════════"
    
    failed=0
    
    check_database || failed=$((failed + 1))
    check_redis || failed=$((failed + 1))
    check_api || failed=$((failed + 1))
    check_web || failed=$((failed + 1))
    
    if [ $failed -gt 0 ]; then
      alert "⚠️  Infamous Freight Health Alert" "Failed checks: $failed\nSee logs at $LOG_FILE"
    else
      log "✅ All services healthy"
    fi
    
    sleep "$INTERVAL"
  done
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --interval)
      INTERVAL="$2"
      shift 2
      ;;
    --alert)
      ALERT_EMAIL="$2"
      shift 2
      ;;
    --once)
      # Run health check once and exit
      echo ""
      log "Running single health check..."
      log "═══════════════════════════════════════"
      check_database
      check_redis
      check_api
      check_web
      log "═══════════════════════════════════════"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Main
continuous_monitoring
