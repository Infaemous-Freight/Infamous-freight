#!/bin/bash
# Production Health Monitoring Script
# Checks API health and sends alerts if down

set -euo pipefail

# Configuration
API_URL="${API_URL:-http://localhost:4000}"
HEALTH_ENDPOINT="${API_URL}/api/health"
METRICS_ENDPOINT="${API_URL}/api/metrics"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"
CHECK_INTERVAL="${CHECK_INTERVAL:-60}"
MAX_RESPONSE_TIME=2000  # milliseconds
ALERT_COOLDOWN=300  # seconds

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# State file
STATE_FILE="/tmp/health-monitor-state.json"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

send_alert() {
    local message="$1"
    local severity="${2:-warning}"
    
    log "${RED}ALERT: ${message}${NC}"
    
    # Send to webhook if configured
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🚨 [$severity] $message\",\"timestamp\":\"$(date -Iseconds)\"}" \
            2>/dev/null || true
    fi
    
    # Update alert state
    echo "{\"last_alert\":$(date +%s),\"message\":\"$message\"}" > "$STATE_FILE"
}

check_alert_cooldown() {
    if [ ! -f "$STATE_FILE" ]; then
        return 0
    fi
    
    local last_alert
    last_alert=$(jq -r '.last_alert' "$STATE_FILE" 2>/dev/null || echo 0)
    local now=$(date +%s)
    local elapsed=$((now - last_alert))
    
    [ $elapsed -gt $ALERT_COOLDOWN ]
}

check_health() {
    local start_time=$(date +%s%3N)
    
    # Make health check request
    local response
    local http_code
    response=$(curl -s -w "\n%{http_code}" -m 5 "$HEALTH_ENDPOINT" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -1)
    local body=$(echo "$response" | head -n -1)
    
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    # Check HTTP status
    if [ "$http_code" != "200" ]; then
        if check_alert_cooldown; then
            send_alert "API health check failed - HTTP $http_code" "critical"
        fi
        return 1
    fi
    
    # Check response time
    if [ $response_time -gt $MAX_RESPONSE_TIME ]; then
        log "${YELLOW}WARNING: Slow response time: ${response_time}ms${NC}"
        if check_alert_cooldown; then
            send_alert "API response time slow: ${response_time}ms (threshold: ${MAX_RESPONSE_TIME}ms)" "warning"
        fi
    fi
    
    # Parse response
    local status
    status=$(echo "$body" | jq -r '.status' 2>/dev/null || echo "unknown")
    
    if [ "$status" != "ok" ]; then
        if check_alert_cooldown; then
            send_alert "API health status: $status" "critical"
        fi
        return 1
    fi
    
    log "${GREEN}✓ Health check passed${NC} (${response_time}ms)"
    return 0
}

check_metrics() {
    local response
    local http_code
    response=$(curl -s -w "\n%{http_code}" -m 5 "$METRICS_ENDPOINT" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" != "200" ]; then
        log "${YELLOW}WARNING: Metrics endpoint unavailable${NC}"
        return 1
    fi
    
    log "${GREEN}✓ Metrics available${NC}"
    return 0
}

check_database() {
    # Try to fetch shipments (minimal query)
    local response
    local http_code
    response=$(curl -s -w "\n%{http_code}" -m 5 \
        -H "Authorization: Bearer ${API_TOKEN:-}" \
        "${API_URL}/api/shipments?limit=1" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" = "401" ]; then
        # Auth required but endpoint responding
        log "${GREEN}✓ Database connectivity OK (auth required)${NC}"
        return 0
    elif [ "$http_code" = "200" ]; then
        log "${GREEN}✓ Database connectivity OK${NC}"
        return 0
    else
        log "${YELLOW}WARNING: Database check returned HTTP $http_code${NC}"
        return 1
    fi
}

main() {
    log "Starting health monitor for $API_URL"
    log "Check interval: ${CHECK_INTERVAL}s"
    log "Alert webhook: ${ALERT_WEBHOOK:-not configured}"
    
    while true; do
        if check_health; then
            check_metrics || true
            check_database || true
        else
            log "${RED}✗ Health check failed${NC}"
        fi
        
        sleep "$CHECK_INTERVAL"
    done
}

# Handle signals
trap 'log "Health monitor stopped"; exit 0' SIGINT SIGTERM

# Run
main
