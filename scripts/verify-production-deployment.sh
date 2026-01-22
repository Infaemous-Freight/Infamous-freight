#!/bin/bash

# Production Deployment Verification Script
# Comprehensive post-deployment health checks

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3002}"
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_INTERVAL=5

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0

# Functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

print_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Health Check Functions
check_api_health() {
    print_header "API Health Check"
    
    local attempt=1
    while [ $attempt -le $HEALTH_CHECK_RETRIES ]; do
        local response=$(curl -s -w "\n%{http_code}" "$API_URL/api/health" 2>/dev/null || echo "000")
        local http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "200" ]; then
            local body=$(echo "$response" | head -n -1)
            print_pass "API is healthy (HTTP 200)"
            
            # Check body content
            if echo "$body" | grep -q '"status":"ok"'; then
                print_pass "API status is ok"
            else
                print_warning "API status field missing or incorrect"
            fi
            
            if echo "$body" | grep -q '"uptime"'; then
                print_pass "API uptime tracking working"
            fi
            
            return 0
        fi
        
        echo -n "."
        sleep $HEALTH_CHECK_INTERVAL
        ((attempt++))
    done
    
    print_fail "API health check failed after $HEALTH_CHECK_RETRIES attempts"
    return 1
}

check_web_health() {
    print_header "Web Health Check"
    
    local response=$(curl -s -w "\n%{http_code}" "$WEB_URL/" 2>/dev/null || echo "000")
    local http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        print_pass "Web application is responding (HTTP 200)"
        return 0
    else
        print_fail "Web application returned HTTP $http_code"
        return 1
    fi
}

check_database_connection() {
    print_header "Database Connection Check"
    
    # Check via API
    local response=$(curl -s -X POST "$API_URL/api/admin/health/database" \
        -H "Content-Type: application/json" 2>/dev/null)
    
    if echo "$response" | grep -q '"database":"connected"'; then
        print_pass "Database connection verified"
        return 0
    else
        print_warning "Could not verify database connection via API"
        return 0  # Non-blocking, API might not have this endpoint
    fi
}

check_redis_connection() {
    print_header "Redis Connection Check"
    
    # Try direct redis-cli if available
    if command -v redis-cli &> /dev/null; then
        if redis-cli -p 6379 ping &>/dev/null || redis-cli ping &>/dev/null; then
            print_pass "Redis is responding"
            return 0
        else
            print_warning "Could not connect to Redis via CLI"
        fi
    fi
    
    # Try via API
    local response=$(curl -s -X POST "$API_URL/api/admin/health/redis" \
        -H "Content-Type: application/json" 2>/dev/null)
    
    if echo "$response" | grep -q '"redis":"connected"'; then
        print_pass "Redis connection verified"
        return 0
    else
        print_warning "Could not verify Redis connection"
        return 0  # Non-blocking
    fi
}

check_api_endpoints() {
    print_header "API Endpoints Check"
    
    local endpoints=(
        "/api/health:GET:200"
        "/api/shipments:GET:401"  # Should return 401 without auth
        "/api/metrics:GET:200"
    )
    
    for endpoint_spec in "${endpoints[@]}"; do
        IFS=':' read -r endpoint method expected_code <<< "$endpoint_spec"
        
        local response=$(curl -s -w "%{http_code}" "$API_URL$endpoint" \
            -X "$method" 2>/dev/null || echo "000")
        local http_code=$(echo "$response" | tail -c 4)
        
        if [ "$http_code" = "$expected_code" ]; then
            print_pass "Endpoint $endpoint returns $http_code"
        else
            print_warning "Endpoint $endpoint returned $http_code (expected $expected_code)"
        fi
    done
}

check_response_times() {
    print_header "Response Time Check"
    
    # Check API response time
    local api_time=$(curl -s -w "%{time_total}" -o /dev/null "$API_URL/api/health" 2>/dev/null)
    local api_ms=$(echo "$api_time * 1000" | bc 2>/dev/null || echo "?")
    
    if (( $(echo "$api_ms < 500" | bc -l 2>/dev/null || echo 0) )); then
        print_pass "API response time: ${api_ms}ms (< 500ms)"
    else
        print_warning "API response time: ${api_ms}ms (> 500ms)"
    fi
    
    # Check Web response time
    local web_time=$(curl -s -w "%{time_total}" -o /dev/null "$WEB_URL/" 2>/dev/null)
    local web_ms=$(echo "$web_time * 1000" | bc 2>/dev/null || echo "?")
    
    if (( $(echo "$web_ms < 2000" | bc -l 2>/dev/null || echo 0) )); then
        print_pass "Web response time: ${web_ms}ms (< 2000ms)"
    else
        print_warning "Web response time: ${web_ms}ms (> 2000ms)"
    fi
}

check_docker_services() {
    print_header "Docker Services Check"
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not found, skipping Docker checks"
        return 0
    fi
    
    local services=("nginx" "api" "web" "postgres" "redis" "prometheus" "grafana")
    
    for service in "${services[@]}"; do
        local status=$(docker ps --filter "name=$service" --format "{{.State}}" 2>/dev/null || echo "unknown")
        
        if [ "$status" = "running" ]; then
            print_pass "Docker service '$service' is running"
        else
            print_warning "Docker service '$service' status: $status"
        fi
    done
}

check_ssl_certificate() {
    print_header "SSL Certificate Check"
    
    local cert_file="nginx/ssl/infamous-freight.crt"
    
    if [ -f "$cert_file" ]; then
        local expiry=$(openssl x509 -in "$cert_file" -noout -enddate 2>/dev/null | cut -d= -f2)
        print_pass "SSL certificate found: expires $expiry"
        
        # Check if expiring soon (< 30 days)
        local days_until_expiry=$(( ($(date -d "$expiry" +%s) - $(date +%s)) / 86400 ))
        
        if [ $days_until_expiry -lt 30 ]; then
            print_warning "SSL certificate expiring in $days_until_expiry days"
        elif [ $days_until_expiry -lt 0 ]; then
            print_fail "SSL certificate has EXPIRED"
        else
            print_pass "SSL certificate valid for $days_until_expiry more days"
        fi
    else
        print_warning "SSL certificate not found at $cert_file"
    fi
}

check_logging() {
    print_header "Logging System Check"
    
    if [ -f "api/logs/combined.log" ]; then
        local recent_errors=$(tail -n 100 api/logs/combined.log 2>/dev/null | grep -c "ERROR" || echo "0")
        if [ "$recent_errors" -gt 10 ]; then
            print_warning "Found $recent_errors errors in recent logs"
        else
            print_pass "Recent logs show $recent_errors errors (acceptable)"
        fi
    else
        print_warning "Log file not found"
    fi
}

check_monitoring_stack() {
    print_header "Monitoring Stack Check"
    
    # Check Prometheus
    local prom_response=$(curl -s -w "%{http_code}" "$PROMETHEUS_URL/-/healthy" 2>/dev/null || echo "000")
    if echo "$prom_response" | grep -q "200"; then
        print_pass "Prometheus is responding"
    else
        print_warning "Prometheus health check returned HTTP $(echo "$prom_response" | tail -c 4)"
    fi
    
    # Check Grafana
    local grafana_response=$(curl -s -w "%{http_code}" "$GRAFANA_URL/api/health" 2>/dev/null || echo "000")
    if echo "$grafana_response" | grep -q "200"; then
        print_pass "Grafana is responding"
    else
        print_warning "Grafana health check returned HTTP $(echo "$grafana_response" | tail -c 4)"
    fi
}

check_metrics() {
    print_header "Metrics Check"
    
    # Query Prometheus for metrics
    local metrics_query=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=up" 2>/dev/null)
    
    if echo "$metrics_query" | grep -q '"status":"success"'; then
        print_pass "Prometheus metrics available"
        
        # Count active services
        local service_count=$(echo "$metrics_query" | grep -o '"value":\[' | wc -l)
        print_pass "Found metrics for $service_count services"
    else
        print_warning "Could not query Prometheus metrics"
    fi
}

check_security_headers() {
    print_header "Security Headers Check"
    
    local headers=$(curl -s -I "$WEB_URL/" 2>/dev/null)
    
    local headers_to_check=(
        "Strict-Transport-Security"
        "X-Frame-Options"
        "X-Content-Type-Options"
        "X-XSS-Protection"
    )
    
    for header in "${headers_to_check[@]}"; do
        if echo "$headers" | grep -q "$header"; then
            print_pass "Security header '$header' present"
        else
            print_warning "Security header '$header' missing"
        fi
    done
}

check_environment_variables() {
    print_header "Environment Variables Check"
    
    local required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "REDIS_URL"
        "NODE_ENV"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -n "${!var}" ]; then
            print_pass "Environment variable '$var' is set"
        else
            print_fail "Environment variable '$var' is NOT set"
        fi
    done
}

check_disk_space() {
    print_header "Disk Space Check"
    
    if command -v df &> /dev/null; then
        local usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
        
        if [ "$usage" -lt 80 ]; then
            print_pass "Disk space usage: $usage% (< 80%)"
        elif [ "$usage" -lt 90 ]; then
            print_warning "Disk space usage: $usage% (80-90%)"
        else
            print_fail "Disk space usage: $usage% (> 90%)"
        fi
    fi
}

check_memory_usage() {
    print_header "Memory Usage Check"
    
    if command -v free &> /dev/null; then
        local memory_info=$(free | grep Mem)
        local total=$(echo "$memory_info" | awk '{print $2}')
        local used=$(echo "$memory_info" | awk '{print $3}')
        local percent=$((used * 100 / total))
        
        if [ "$percent" -lt 80 ]; then
            print_pass "Memory usage: $percent% (< 80%)"
        elif [ "$percent" -lt 90 ]; then
            print_warning "Memory usage: $percent% (80-90%)"
        else
            print_fail "Memory usage: $percent% (> 90%)"
        fi
    fi
}

check_pm2_processes() {
    print_header "PM2 Processes Check"
    
    if command -v pm2 &> /dev/null; then
        local processes=$(pm2 list 2>/dev/null || echo "")
        
        if echo "$processes" | grep -q "api"; then
            print_pass "API process found in PM2"
        else
            print_warning "API process not found in PM2"
        fi
        
        if echo "$processes" | grep -q "web"; then
            print_pass "Web process found in PM2"
        else
            print_warning "Web process not found in PM2"
        fi
    else
        print_warning "PM2 not installed"
    fi
}

# Main execution
main() {
    print_header "🚀 Production Deployment Verification"
    echo "Start Time: $(date)"
    echo "API URL: $API_URL"
    echo "Web URL: $WEB_URL"
    echo ""
    
    # Run all checks
    check_environment_variables
    check_api_health
    check_web_health
    check_database_connection
    check_redis_connection
    check_api_endpoints
    check_response_times
    check_docker_services
    check_ssl_certificate
    check_logging
    check_monitoring_stack
    check_metrics
    check_security_headers
    check_disk_space
    check_memory_usage
    check_pm2_processes
    
    # Summary
    print_header "📋 Verification Summary"
    
    local total=$((CHECKS_PASSED + CHECKS_FAILED))
    local success_rate=$((CHECKS_PASSED * 100 / total))
    
    echo "Total Checks: $total"
    echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
    echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
    echo "Success Rate: $success_rate%"
    echo ""
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! System is ready for production.${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Monitor dashboards for 24 hours"
        echo "  2. Check for any alerts"
        echo "  3. Verify business metrics"
        echo "  4. Archive deployment logs"
        return 0
    elif [ $CHECKS_FAILED -le 3 ]; then
        echo -e "${YELLOW}⚠ Some checks failed. Review warnings above.${NC}"
        return 1
    else
        echo -e "${RED}✗ Multiple critical checks failed. Do not proceed to production.${NC}"
        return 1
    fi
}

# Parse arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --api-url URL          API base URL (default: http://localhost:3001)"
    echo "  --web-url URL          Web base URL (default: http://localhost:3000)"
    echo "  --help                 Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --api-url http://api.example.com --web-url http://example.com"
    exit 0
fi

while [[ $# -gt 0 ]]; do
    case $1 in
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --web-url)
            WEB_URL="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

main
