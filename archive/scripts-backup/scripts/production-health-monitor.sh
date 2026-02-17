#!/usr/bin/env bash
# Production health monitor (API + Web)

set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
HEALTH_ENDPOINT="${API_URL}/api/health"
WEB_ENDPOINT="${WEB_URL}/"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"
CHECK_INTERVAL="${CHECK_INTERVAL:-60}"
MAX_API_RESPONSE_MS="${MAX_API_RESPONSE_MS:-2000}"
MAX_WEB_RESPONSE_MS="${MAX_WEB_RESPONSE_MS:-2500}"
ALERT_COOLDOWN="${ALERT_COOLDOWN:-300}"
STATE_FILE="/tmp/production-health-monitor.state"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

send_alert() {
  local message="$1"
  log "${RED}ALERT${NC} $message"
  if [ -n "$ALERT_WEBHOOK" ]; then
    curl -s -X POST "$ALERT_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "{\"text\":\"[alert] ${message}\",\"timestamp\":\"$(date -Iseconds)\"}" \
      >/dev/null 2>&1 || true
  fi
  date +%s > "$STATE_FILE"
}

cooldown_passed() {
  if [ ! -f "$STATE_FILE" ]; then
    return 0
  fi
  local last
  last=$(cat "$STATE_FILE" 2>/dev/null || echo 0)
  local now
  now=$(date +%s)
  local elapsed=$((now - last))
  [ $elapsed -gt $ALERT_COOLDOWN ]
}

check_api() {
  local start_ms
  start_ms=$(date +%s%3N)
  local response
  response=$(curl -s -w "\n%{http_code}" -m 5 "$HEALTH_ENDPOINT" 2>/dev/null || echo -e "\n000")
  local http_code
  http_code=$(echo "$response" | tail -1)
  local body
  body=$(echo "$response" | head -n -1)
  local end_ms
  end_ms=$(date +%s%3N)
  local elapsed=$((end_ms - start_ms))

  if [ "$http_code" != "200" ]; then
    if cooldown_passed; then
      send_alert "API health check failed (HTTP ${http_code})"
    fi
    log "${RED}API FAIL${NC} HTTP ${http_code}"
    return 1
  fi

  if ! echo "$body" | grep -q '"status":"ok"'; then
    if cooldown_passed; then
      send_alert "API health check returned unexpected status"
    fi
    log "${YELLOW}API WARN${NC} status not ok"
  fi

  if [ $elapsed -gt $MAX_API_RESPONSE_MS ]; then
    if cooldown_passed; then
      send_alert "API response time slow (${elapsed}ms)"
    fi
    log "${YELLOW}API WARN${NC} response ${elapsed}ms"
  else
    log "${GREEN}API OK${NC} ${elapsed}ms"
  fi
  return 0
}

check_web() {
  local start_ms
  start_ms=$(date +%s%3N)
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" -m 5 "$WEB_ENDPOINT" 2>/dev/null || echo "000")
  local end_ms
  end_ms=$(date +%s%3N)
  local elapsed=$((end_ms - start_ms))

  case "$http_code" in
    200|301|302|304)
      if [ $elapsed -gt $MAX_WEB_RESPONSE_MS ]; then
        if cooldown_passed; then
          send_alert "Web response time slow (${elapsed}ms)"
        fi
        log "${YELLOW}WEB WARN${NC} response ${elapsed}ms"
      else
        log "${GREEN}WEB OK${NC} ${elapsed}ms"
      fi
      return 0
      ;;
    *)
      if cooldown_passed; then
        send_alert "Web health check failed (HTTP ${http_code})"
      fi
      log "${RED}WEB FAIL${NC} HTTP ${http_code}"
      return 1
      ;;
  esac
}

main() {
  log "Starting production health monitor"
  log "API: $API_URL"
  log "Web: $WEB_URL"
  log "Interval: ${CHECK_INTERVAL}s"

  while true; do
    check_api || true
    check_web || true
    sleep "$CHECK_INTERVAL"
  done
}

trap 'log "Monitor stopped"; exit 0' SIGINT SIGTERM
main
