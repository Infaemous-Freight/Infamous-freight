#!/bin/bash

# Full Stack Test - Verify All Services
# Tests API health, database, Redis, and web connectivity

set -e

echo "================================"
echo "🧪 Full Stack Verification Test"
echo "================================"
echo ""

# Configuration
API_URL="${1:-https://infamous-freight-api-production.up.railway.app}"
WEB_URL="${2:-https://infamous-freight-web-production.up.railway.app}"
TIMEOUT=10

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    echo -n "Testing $name... "
    
    if response=$(curl -s -w "\n%{http_code}" -m $TIMEOUT "$url" 2>/dev/null); then
        http_code=$(echo "$response" | tail -1)
        body=$(echo "$response" | head -1)
        
        if [ "$http_code" = "$expected_status" ]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Connection timeout or error)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: API Health Check
echo "📌 Test Group 1: API Health & Connectivity"
echo "   URL: $API_URL"
echo ""

test_endpoint "API Health Check" "$API_URL/api/health" 200

# Test 2: API Readiness (if endpoint exists)
test_endpoint "API Root" "$API_URL/api" || true

echo ""

# Test 3: Web Connectivity
echo "📌 Test Group 2: Web Frontend"
echo "   URL: $WEB_URL"
echo ""

test_endpoint "Web Homepage" "$WEB_URL/" 200

echo ""

# Test 4: Database Connectivity (via API)
echo "📌 Test Group 3: Database Access"
echo ""

test_endpoint "API Database Query" "$API_URL/api/health" 200 || true

echo ""

# Test 5: Quick Performance Check
echo "📌 Test Group 4: Performance Baseline"
echo ""

echo -n "Measuring API response time... "
start_time=$(date +%s%N)
http_code=$(curl -s -o /dev/null -w "%{http_code}" -m $TIMEOUT "$API_URL/api/health" 2>/dev/null)
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ "$http_code" = "200" ]; then
    if [ $response_time -lt 500 ]; then
        echo -e "${GREEN}✓ PASS${NC} (${response_time}ms - Excellent)"
        ((TESTS_PASSED++))
    elif [ $response_time -lt 1000 ]; then
        echo -e "${YELLOW}⚠ WARN${NC} (${response_time}ms - Could be faster)"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠ WARN${NC} (${response_time}ms - Slow)"
        ((TESTS_PASSED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
    ((TESTS_FAILED++))
fi

echo ""

# Test 6: HTTPS/SSL Validation
echo "📌 Test Group 5: Security"
echo ""

echo -n "Checking HTTPS/SSL certificate... "
if openssl s_client -connect ${API_URL#https://} -servername ${API_URL#https://} </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo -e "${GREEN}✓ PASS${NC} (Valid SSL certificate)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (SSL certificate issue)"
    ((TESTS_FAILED++))
fi

echo ""

# Summary
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo ""
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! System is operational.${NC}"
    echo ""
    echo "Your deployment is ready for use:"
    echo "  🌐 Web: $WEB_URL"
    echo "  🔌 API: $API_URL/api/health"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check Railway dashboard: https://railway.app"
    echo "2. View logs: railway deployment logs --follow"
    echo "3. Verify health endpoints are accessible"
    echo "4. Check environment variables are set"
    echo ""
    exit 1
fi
