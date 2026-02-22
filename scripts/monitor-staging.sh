#!/bin/bash
# Post-Deployment Monitoring Script
# Monitors staging deployment health for 72-hour validation period
# See: STAGING-DEPLOYMENT-READINESS.md for success criteria

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
API_HOST="${API_HOST:-localhost:4000}"
WEB_HOST="${WEB_HOST:-localhost:3000}"
MONITORING_INTERVAL="${MONITORING_INTERVAL:-60}" # seconds
MAX_ITERATIONS="${MAX_ITERATIONS:-0}" # 0 = infinite

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║        Staging Environment Health Monitoring                  ║
║        72-Hour Validation Period Tracker                      ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

iteration=0
start_time=$(date +%s)
api_failures=0
web_failures=0
last_api_response_time=0
last_web_response_time=0

# Function to check API health
check_api_health() {
    local start=$(date +%s%3N)
    
    if response=$(curl -s -f -m 5 "http://${API_HOST}/api/health" 2>&1); then
        local end=$(date +%s%3N)
        response_time=$((end - start))
        
        # Parse response
        status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "unknown")
        uptime=$(echo "$response" | jq -r '.uptime' 2>/dev/null || echo "N/A")
        
        if [ "$status" = "ok" ]; then
            api_failures=0
            last_api_response_time=$response_time
            echo -e "${GREEN}✅ API${NC}  Status: $status | Uptime: ${uptime}s | Response: ${response_time}ms"
            
            # Check response time threshold
            if [ $response_time -gt 200 ]; then
                echo -e "   ${YELLOW}⚠️  Response time > 200ms (P50 target)${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  API${NC}  Status: degraded"
            api_failures=$((api_failures + 1))
        fi
    else
        echo -e "${RED}❌ API${NC}  Health check failed"
        api_failures=$((api_failures + 1))
        
        if [ $api_failures -ge 3 ]; then
            echo -e "${RED}🚨 ALERT: API failing for $api_failures consecutive checks${NC}"
            echo -e "${RED}   Action required: Check logs and consider rollback${NC}"
        fi
    fi
}

# Function to check web health
check_web_health() {
    local start=$(date +%s%3N)
    
    if curl -s -f -m 5 "http://${WEB_HOST}" > /dev/null 2>&1; then
        local end=$(date +%s%3N)
        response_time=$((end - start))
        
        web_failures=0
        last_web_response_time=$response_time
        echo -e "${GREEN}✅ WEB${NC}  Response: ${response_time}ms"
        
        # Check response time threshold
        if [ $response_time -gt 2000 ]; then
            echo -e "   ${YELLOW}⚠️  Response time > 2s (target)${NC}"
        fi
    else
        echo -e "${RED}❌ WEB${NC}  Health check failed"
        web_failures=$((web_failures + 1))
        
        if [ $web_failures -ge 3 ]; then
            echo -e "${RED}🚨 ALERT: Web failing for $web_failures consecutive checks${NC}"
        fi
    fi
}

# Function to check Docker container status
check_docker_status() {
    if command -v docker &> /dev/null; then
        api_container=$(docker ps --filter "name=api" --format "{{.Status}}" 2>/dev/null | head -1)
        web_container=$(docker ps --filter "name=web" --format "{{.Status}}" 2>/dev/null | head -1)
        db_container=$(docker ps --filter "name=db" --format "{{.Status}}" 2>/dev/null | head -1)
        
        echo -e "${CYAN}🐳 Docker:${NC}"
        [ -n "$api_container" ] && echo -e "   API: $api_container" || echo -e "   API: ${YELLOW}Not found${NC}"
        [ -n "$web_container" ] && echo -e "   Web: $web_container" || echo -e "   Web: ${YELLOW}Not found${NC}"
        [ -n "$db_container" ] && echo -e "   DB:  $db_container" || echo -e "   DB:  ${YELLOW}Not found${NC}"
    fi
}

# Function to check recent error logs
check_error_logs() {
    if command -v docker &> /dev/null; then
        echo -e "${MAGENTA}📋 Recent Errors:${NC}"
        
        # Check API errors
        api_errors=$(docker logs app-api-1 2>&1 | grep -i "error\|exception\|failed" | tail -3 | wc -l)
        if [ $api_errors -gt 0 ]; then
            echo -e "   ${YELLOW}API: $api_errors recent error patterns${NC}"
            docker logs app-api-1 2>&1 | grep -i "error\|exception" | tail -1 | sed 's/^/     /'
        else
            echo -e "   ${GREEN}API: No recent errors${NC}"
        fi
        
        # Check for XXE-related errors (CRITICAL vulnerability monitoring)
        xxe_alerts=$(docker logs app-api-1 2>&1 | grep -i "xxe\|xml.*parse\|fast-xml-parser" | tail -3 | wc -l)
        if [ $xxe_alerts -gt 0 ]; then
            echo -e "   ${RED}🚨 XXE-related errors detected!${NC}"
            docker logs app-api-1 2>&1 | grep -i "xxe\|xml.*parse" | tail -2 | sed 's/^/     /'
        fi
    fi
}

# Function to calculate elapsed time
calculate_elapsed() {
    local current=$(date +%s)
    local elapsed=$((current - start_time))
    local hours=$((elapsed / 3600))
    local minutes=$(((elapsed % 3600) / 60))
    local seconds=$((elapsed % 60))
    
    printf "%02d:%02d:%02d" $hours $minutes $seconds
}

# Function to calculate remaining validation time
calculate_remaining() {
    local current=$(date +%s)
    local elapsed=$((current - start_time))
    local total_seconds=$((72 * 3600)) # 72 hours
    local remaining=$((total_seconds - elapsed))
    
    if [ $remaining -gt 0 ]; then
        local days=$((remaining / 86400))
        local hours=$(((remaining % 86400) / 3600))
        local minutes=$(((remaining % 3600) / 60))
        
        if [ $days -gt 0 ]; then
            printf "%dd %02dh %02dm" $days $hours $minutes
        else
            printf "%02dh %02dm" $hours $minutes
        fi
    else
        echo "COMPLETE"
    fi
}

# Main monitoring loop
echo -e "${BLUE}Starting monitoring... (Ctrl+C to stop)${NC}"
echo -e "${BLUE}Checking every ${MONITORING_INTERVAL}s${NC}"
echo ""

while true; do
    iteration=$((iteration + 1))
    elapsed=$(calculate_elapsed)
    remaining=$(calculate_remaining)
    
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Check #${iteration} | Elapsed: ${elapsed} | Remaining: ${remaining}${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    check_api_health
    check_web_health
    check_docker_status
    check_error_logs
    
    # Success criteria tracking
    echo -e "${BLUE}📊 Validation Criteria:${NC}"
    
    # API uptime
    if [ $api_failures -eq 0 ]; then
        echo -e "   ${GREEN}✅${NC} API uptime: Healthy"
    else
        echo -e "   ${RED}❌${NC} API uptime: ${api_failures} consecutive failures"
    fi
    
    # Response time P50
    if [ $last_api_response_time -lt 200 ]; then
        echo -e "   ${GREEN}✅${NC} API response time: ${last_api_response_time}ms < 200ms (P50 target)"
    elif [ $last_api_response_time -gt 0 ]; then
        echo -e "   ${YELLOW}⚠️${NC}  API response time: ${last_api_response_time}ms > 200ms"
    fi
    
    # Web performance
    if [ $last_web_response_time -lt 2000 ]; then
        echo -e "   ${GREEN}✅${NC} Web response time: ${last_web_response_time}ms < 2s"
    elif [ $last_web_response_time -gt 0 ]; then
        echo -e "   ${YELLOW}⚠️${NC}  Web response time: ${last_web_response_time}ms > 2s"
    fi
    
    # Check if 72 hours complete
    if [ "$(calculate_remaining)" = "COMPLETE" ]; then
        echo ""
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  72-HOUR VALIDATION PERIOD COMPLETE                           ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "Next steps:"
        echo -e "  1. Review complete logs and metrics"
        echo -e "  2. Complete security review (SECURITY.md)"
        echo -e "  3. Get stakeholder sign-off"
        echo -e "  4. Deploy to production (if approved)"
        echo ""
        exit 0
    fi
    
    # Check max iterations
    if [ $MAX_ITERATIONS -gt 0 ] && [ $iteration -ge $MAX_ITERATIONS ]; then
        echo ""
        echo -e "${YELLOW}Max iterations reached. Exiting.${NC}"
        exit 0
    fi
    
    echo ""
    sleep $MONITORING_INTERVAL
done
