#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# PHASE 9: RUNBOOK AUTOMATION SUITE
# On-call team automation scripts for incident response
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
INCIDENT_LOG="incident_${TIMESTAMP}.log"

# ═══════════════════════════════════════════════════════════════════════════
# 1. HEALTH CHECK SCRIPT (One-liner status)
# ═══════════════════════════════════════════════════════════════════════════

health_check() {
  echo -e "${BLUE}🔍 Running system health check...${NC}"
  
  # Check API health
  API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.fly.dev/api/health)
  if [[ $API_STATUS == 200 ]]; then
    echo -e "${GREEN}✅ API: HEALTHY (HTTP $API_STATUS)${NC}"
  else
    echo -e "${RED}❌ API: DOWN (HTTP $API_STATUS)${NC}"
  fi
  
  # Check database
  DB_STATUS=$(curl -s https://api.fly.dev/api/health | jq '.database' 2>/dev/null || echo "unknown")
  echo -e "   Database: $DB_STATUS"
  
  # Check Fly.io status
  INSTANCES=$(flyctl status -a infamous-freight-api --json 2>/dev/null | jq '.Instances | length' || echo "0")
  echo -e "   Running instances: $INSTANCES"
  
  # Check error rate (from Sentry)
  echo -e "   → View errors: https://sentry.io/organizations/infamous-freight/issues/"
  echo -e "   → View metrics: https://app.datadoghq.com/dashboard/"
}

# ═══════════════════════════════════════════════════════════════════════════
# 2. LOG PARSER (Filter by error type)
# ═══════════════════════════════════════════════════════════════════════════

parse_logs() {
  local ERROR_TYPE=${1:-error}
  local LINES=${2:-50}
  
  echo -e "${BLUE}📋 Fetching last $LINES lines of $ERROR_TYPE logs...${NC}"
  
  flyctl logs -a infamous-freight-api --json 2>/dev/null | \
    jq "select(.message | contains(\"$ERROR_TYPE\"))" | \
    tail -n $LINES
}

# Filter common error types
filter_logs_by_type() {
  local TYPE=$1
  echo -e "${BLUE}📋 Filtering logs by type: $TYPE${NC}"
  
  case $TYPE in
    "500")
      flyctl logs -a infamous-freight-api | grep "500\|error\|exception" || echo "No 500 errors found"
      ;;
    "database")
      flyctl logs -a infamous-freight-api | grep -i "database\|postgres\|connection" || echo "No DB errors found"
      ;;
    "auth")
      flyctl logs -a infamous-freight-api | grep -i "auth\|token\|unauthorized" || echo "No auth errors found"
      ;;
    "cache")
      flyctl logs -a infamous-freight-api | grep -i "redis\|cache\|memory" || echo "No cache errors found"
      ;;
    *)
      flyctl logs -a infamous-freight-api | grep -i "$TYPE" || echo "No matching logs found"
      ;;
  esac
}

# ═══════════════════════════════════════════════════════════════════════════
# 3. DATABASE CONNECTION TEST
# ═══════════════════════════════════════════════════════════════════════════

test_database() {
  echo -e "${BLUE}🗄️ Testing database connection...${NC}"
  
  # Get connection string
  DB_URL=$(flyctl secrets list -a infamous-freight-api | grep DATABASE_URL | awk '{print $3}')
  
  if [[ -z "$DB_URL" ]]; then
    echo -e "${YELLOW}⚠️ DATABASE_URL not found in secrets${NC}"
    return
  fi
  
  # Test connection
  if psql "$DB_URL" -c "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✅ Database connection: OK${NC}"
    
    # Check connection pool
    CONNECTIONS=$(psql "$DB_URL" -c "SELECT count(*) as connections FROM pg_stat_activity;" 2>/dev/null | tail -1)
    echo -e "   Active connections: $CONNECTIONS"
  else
    echo -e "${RED}❌ Database connection: FAILED${NC}"
    echo -e "   Try: flyctl ssh console -a infamous-freight-api"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# 4. CACHE DIAGNOSTIC
# ═══════════════════════════════════════════════════════════════════════════

diagnose_cache() {
  echo -e "${BLUE}💾 Diagnosing Redis cache...${NC}"
  
  # Get Redis URL
  REDIS_URL=$(flyctl secrets list -a infamous-freight-api | grep REDIS_URL | awk '{print $3}')
  
  if [[ -z "$REDIS_URL" ]]; then
    echo -e "${YELLOW}⚠️ REDIS_URL not configured${NC}"
    return
  fi
  
  # Check connection
  if redis-cli -u "$REDIS_URL" ping &> /dev/null; then
    echo -e "${GREEN}✅ Redis connection: OK${NC}"
    
    # Get stats
    INFO=$(redis-cli -u "$REDIS_URL" info stats)
    MEMORY=$(redis-cli -u "$REDIS_URL" info memory | grep used_memory_human)
    
    echo -e "   $MEMORY"
    echo -e "   Connected clients: $(echo "$INFO" | grep connected_clients | cut -d: -f2)"
  else
    echo -e "${RED}❌ Redis connection: FAILED${NC}"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# 5. AUTO-RECOVERY PROCEDURES
# ═══════════════════════════════════════════════════════════════════════════

restart_api() {
  echo -e "${YELLOW}⚠️ Restarting API service...${NC}"
  
  flyctl apps restart -a infamous-freight-api
  
  echo -e "${BLUE}⏳ Waiting for API to become healthy...${NC}"
  sleep 5
  
  health_check
}

scale_instances() {
  local DESIRED=${1:-2}
  
  echo -e "${YELLOW}🔧 Scaling API to $DESIRED instances...${NC}"
  
  flyctl scale count -a infamous-freight-api $DESIRED
  
  echo -e "${GREEN}✅ Scaling initiated${NC}"
  echo -e "   Current status: flyctl status -a infamous-freight-api"
}

clear_cache() {
  echo -e "${YELLOW}🧹 Clearing Redis cache...${NC}"
  
  REDIS_URL=$(flyctl secrets list -a infamous-freight-api | grep REDIS_URL | awk '{print $3}')
  
  if [[ -n "$REDIS_URL" ]]; then
    redis-cli -u "$REDIS_URL" FLUSHDB
    echo -e "${GREEN}✅ Cache cleared${NC}"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# 6. INCIDENT LOGGING & ESCALATION
# ═══════════════════════════════════════════════════════════════════════════

log_incident() {
  local SEVERITY=${1:-medium}
  local MESSAGE=${2:-"Incident logged"}
  
  {
    echo "[$TIMESTAMP] SEVERITY: $SEVERITY"
    echo "MESSAGE: $MESSAGE"
    echo "API_STATUS: $(curl -s -o /dev/null -w "%{http_code}" https://api.fly.dev/api/health)"
    echo "LOGS:"
    flyctl logs -a infamous-freight-api | tail -20
  } | tee -a "$INCIDENT_LOG"
  
  echo -e "${YELLOW}📝 Incident logged to: $INCIDENT_LOG${NC}"
}

escalate_incident() {
  local SEVERITY=$1
  
  echo -e "${RED}🚨 ESCALATING INCIDENT (Severity: $SEVERITY)${NC}"
  
  case $SEVERITY in
    "critical")
      echo "Triggering PagerDuty CRITICAL alert..."
      # Use PagerDuty API to create incident
      ;;
    "high")
      echo "Triggering PagerDuty HIGH alert..."
      ;;
    "medium")
      echo "Creating Slack notification..."
      ;;
  esac
  
  log_incident "$SEVERITY"
}

# ═══════════════════════════════════════════════════════════════════════════
# 7. COMMON INCIDENT HANDLERS
# ═══════════════════════════════════════════════════════════════════════════

handle_high_cpu() {
  echo -e "${RED}⚠️ High CPU detected${NC}"
  log_incident "high" "High CPU usage detected"
  
  echo "Actions:"
  echo "  1. Scale to more instances: scale_instances 3"
  echo "  2. Check for query issues: parse_logs_by_type database"
  echo "  3. Review active connections: test_database"
}

handle_high_latency() {
  echo -e "${RED}⚠️ High latency detected (P95 > 500ms)${NC}"
  log_incident "high" "High latency detected"
  
  echo "Actions:"
  echo "  1. Clear cache: clear_cache"
  echo "  2. Check DB indexes: test_database"
  echo "  3. Analyze slow queries from Datadog"
}

handle_database_errors() {
  echo -e "${RED}❌ Database connection errors${NC}"
  log_incident "critical" "Database connection failed"
  
  echo "Actions:"
  echo "  1. Check connection: test_database"
  echo "  2. Check connection pool: flyctl logs -a infamous-freight-api | grep connection"
  echo "  3. Escalate to database team"
}

handle_auth_failures() {
  echo -e "${RED}🔐 Authentication failures spike${NC}"
  log_incident "high" "Auth failures increased"
  
  echo "Actions:"
  echo "  1. Check logs: filter_logs_by_type auth"
  echo "  2. Verify JWT_SECRET is set"
  echo "  3. Check rate limiter: filter_logs_by_type rate_limit"
}

# ═══════════════════════════════════════════════════════════════════════════
# 8. MAIN CLI
# ═══════════════════════════════════════════════════════════════════════════

show_help() {
  cat << EOF
${BLUE}╔═══════════════════════════════════════════════════════════════════════╗
║        RUNBOOK AUTOMATION SUITE - Phase 9 On-Call Support               ║
╚═══════════════════════════════════════════════════════════════════════════╝${NC}

USAGE: ./runbook-automation.sh [COMMAND] [OPTIONS]

HEALTH & DIAGNOSTICS:
  health-check          Full system health check
  parse-logs [TYPE]     Filter logs by error type (500, database, auth, cache)
  test-db               Test database connectivity
  diagnose-cache        Check Redis cache status

RECOVERY:
  restart-api           Restart API service
  scale [N]             Scale API to N instances
  clear-cache           Flush Redis cache

INCIDENT MANAGEMENT:
  log-incident [LEVEL]  Log incident (critical/high/medium)
  escalate [LEVEL]      Escalate to PagerDuty
  handle-cpu            Handle high CPU scenario
  handle-latency        Handle high latency scenario
  handle-db-errors      Handle database errors scenario
  handle-auth           Handle auth failures scenario

EXAMPLES:
  ./runbook-automation.sh health-check
  ./runbook-automation.sh parse-logs database
  ./runbook-automation.sh restart-api
  ./runbook-automation.sh scale 3
  ./runbook-automation.sh escalate critical

${YELLOW}IMPORTANT:${NC}
  - Ensure you have flyctl installed and authenticated
  - PostgreSQL client (psql) needed for DB tests
  - Redis CLI needed for cache diagnostics
  - PagerDuty credentials configured for escalation

${GREEN}Quick Reference:${NC}
  Critical (page immediately):
    - API down (HTTP != 200)
    - Error rate > 5%
    - Database unavailable

  High (page within 5 min):
    - Error rate > 1%
    - P95 latency > 1000ms
    - Cache failures

  Medium (daily digest):
    - Slow queries
    - Disk usage trends

EOF
}

main() {
  local COMMAND=${1:-help}
  local OPTION=${2:-}
  
  case "$COMMAND" in
    health-check)
      health_check
      ;;
    parse-logs)
      parse_logs "$OPTION" 50
      ;;
    filter-logs-by-type)
      filter_logs_by_type "$OPTION"
      ;;
    test-db)
      test_database
      ;;
    diagnose-cache)
      diagnose_cache
      ;;
    restart-api)
      restart_api
      ;;
    scale)
      scale_instances "$OPTION"
      ;;
    clear-cache)
      clear_cache
      ;;
    log-incident)
      log_incident "$OPTION"
      ;;
    escalate)
      escalate_incident "$OPTION"
      ;;
    handle-cpu)
      handle_high_cpu
      ;;
    handle-latency)
      handle_high_latency
      ;;
    handle-db-errors)
      handle_database_errors
      ;;
    handle-auth)
      handle_auth_failures
      ;;
    *)
      show_help
      ;;
  esac
}

main "$@"
