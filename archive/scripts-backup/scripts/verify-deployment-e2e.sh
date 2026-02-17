#!/bin/bash
# End-to-End Post-Deployment Verification
# Comprehensive testing of all deployed platforms

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   End-to-End Deployment Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Configuration - Update these with your actual URLs
FLY_APP_NAME="${FLY_APP_NAME:-infamous-freight-api}"
VERCEL_URL="${VERCEL_URL:-https://infamous-freight-enterprises.vercel.app}"
API_BASE_URL="https://${FLY_APP_NAME}.fly.dev"

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Test functions
test_api_health() {
    echo -e "${BLUE}Testing Fly.io API Health...${NC}"
    
    RESPONSE=$(curl -sf "${API_BASE_URL}/api/health" 2>&1)
    
    if [ $? -eq 0 ]; then
        if echo "$RESPONSE" | jq -e '.success == true or .data.status == "ok"' > /dev/null 2>&1; then
            echo -e "${GREEN}✓ API health check passed${NC}"
            echo "  Response: $(echo "$RESPONSE" | jq -c '.')"
            ((PASSED++))
            return 0
        fi
    fi
    
    echo -e "${RED}✗ API health check failed${NC}"
    echo "  Response: $RESPONSE"
    ((FAILED++))
    return 1
}

test_api_response_time() {
    echo -e "${BLUE}Testing API Response Time...${NC}"
    
    TIME=$(curl -o /dev/null -s -w "%{time_total}" "${API_BASE_URL}/api/health")
    
    echo "  Response time: ${TIME}s"
    
    if (( $(echo "$TIME < 2.0" | bc -l) )); then
        echo -e "${GREEN}✓ Response time acceptable (<2s)${NC}"
        ((PASSED++))
    elif (( $(echo "$TIME < 5.0" | bc -l) )); then
        echo -e "${YELLOW}⚠ Response time slow (2-5s)${NC}"
        ((WARNINGS++))
    else
        echo -e "${RED}✗ Response time too slow (>5s)${NC}"
        ((FAILED++))
    fi
}

test_web_accessibility() {
    echo -e "${BLUE}Testing Vercel Web App...${NC}"
    
    HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" "$VERCEL_URL")
    
    echo "  HTTP Status: $HTTP_CODE"
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓ Web app is accessible${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Web app returned HTTP $HTTP_CODE${NC}"
        ((FAILED++))
    fi
}

test_web_load_time() {
    echo -e "${BLUE}Testing Web App Load Time...${NC}"
    
    TIME=$(curl -o /dev/null -s -w "%{time_total}" "$VERCEL_URL")
    
    echo "  Load time: ${TIME}s"
    
    if (( $(echo "$TIME < 3.0" | bc -l) )); then
        echo -e "${GREEN}✓ Load time acceptable (<3s)${NC}"
        ((PASSED++))
    elif (( $(echo "$TIME < 5.0" | bc -l) )); then
        echo -e "${YELLOW}⚠ Load time slow (3-5s)${NC}"
        ((WARNINGS++))
    else
        echo -e "${RED}✗ Load time too slow (>5s)${NC}"
        ((FAILED++))
    fi
}

test_api_cors() {
    echo -e "${BLUE}Testing API CORS Headers...${NC}"
    
    CORS=$(curl -sI -H "Origin: https://example.com" "${API_BASE_URL}/api/health" | grep -i "access-control")
    
    if [ -n "$CORS" ]; then
        echo -e "${GREEN}✓ CORS headers present${NC}"
        echo "  $CORS"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ No CORS headers found${NC}"
        ((WARNINGS++))
    fi
}

test_ssl_certificates() {
    echo -e "${BLUE}Testing SSL Certificates...${NC}"
    
    # Test Fly.io API
    if echo | openssl s_client -connect "${FLY_APP_NAME}.fly.dev:443" -servername "${FLY_APP_NAME}.fly.dev" 2>/dev/null | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✓ Fly.io SSL certificate valid${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Fly.io SSL certificate issue${NC}"
        ((FAILED++))
    fi
    
    # Test Vercel
    VERCEL_DOMAIN=$(echo "$VERCEL_URL" | sed 's|https://||' | sed 's|http://||' | cut -d'/' -f1)
    if echo | openssl s_client -connect "${VERCEL_DOMAIN}:443" -servername "${VERCEL_DOMAIN}" 2>/dev/null | grep -q "Verify return code: 0"; then
        echo -e "${GREEN}✓ Vercel SSL certificate valid${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Vercel SSL certificate issue${NC}"
        ((FAILED++))
    fi
}

test_api_endpoints() {
    echo -e "${BLUE}Testing Critical API Endpoints...${NC}"
    
    # Test health endpoint (detailed)
    if curl -sf "${API_BASE_URL}/api/health/detailed" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Detailed health endpoint accessible${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Detailed health endpoint not accessible${NC}"
        ((WARNINGS++))
    fi
    
    # Test liveness endpoint
    if curl -sf "${API_BASE_URL}/api/health/live" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Liveness endpoint accessible${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Liveness endpoint not accessible${NC}"
        ((WARNINGS++))
    fi
    
    # Test readiness endpoint
    if curl -sf "${API_BASE_URL}/api/health/ready" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Readiness endpoint accessible${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Readiness endpoint not accessible${NC}"
        ((WARNINGS++))
    fi
}

test_web_assets() {
    echo -e "${BLUE}Testing Web App Assets...${NC}"
    
    # Test favicon
    if curl -sf "${VERCEL_URL}/favicon.ico" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Favicon loads${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Favicon not found${NC}"
        ((WARNINGS++))
    fi
}

# Run all tests
echo -e "${BLUE}Running comprehensive verification tests...${NC}"
echo ""

test_api_health
echo ""

test_api_response_time
echo ""

test_web_accessibility
echo ""

test_web_load_time
echo ""

test_api_cors
echo ""

test_ssl_certificates
echo ""

test_api_endpoints
echo ""

test_web_assets
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Verification Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✓ Passed: ${PASSED}${NC}"
echo -e "${YELLOW}⚠ Warnings: ${WARNINGS}${NC}"
echo -e "${RED}✗ Failed: ${FAILED}${NC}"
echo ""

# URLs
echo -e "${BLUE}Deployment URLs:${NC}"
echo "  API:  ${API_BASE_URL}"
echo "  Web:  ${VERCEL_URL}"
echo ""

# Overall status
TOTAL=$((PASSED + WARNINGS + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo -e "${BLUE}Success Rate: ${SUCCESS_RATE}%${NC}"
echo ""

if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment verified 100%.${NC}"
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Deployment verified with warnings.${NC}"
    echo -e "${YELLOW}Review warnings above and monitor in production.${NC}"
    exit 0
else
    echo -e "${RED}❌ Deployment verification failed.${NC}"
    echo -e "${RED}Review failed tests above and investigate issues.${NC}"
    exit 1
fi
