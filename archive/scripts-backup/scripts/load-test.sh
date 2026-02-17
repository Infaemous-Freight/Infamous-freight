#!/bin/bash

# Load Testing Script for Infamous Freight Enterprises API
# Requires: Apache Bench (ab) or similar load testing tool

set -e

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:4000}"
CONCURRENT_REQUESTS="${CONCURRENT_REQUESTS:-50}"
TOTAL_REQUESTS="${TOTAL_REQUESTS:-1000}"
JWT_TOKEN="${JWT_TOKEN:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${GREEN}=== $1 ===${NC}\n"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

check_dependencies() {
    print_header "Checking Dependencies"
    
    if ! command -v ab &> /dev/null; then
        print_error "Apache Bench (ab) is not installed"
        echo "Install with: apt-get install apache2-utils (Ubuntu/Debian)"
        echo "            : brew install httpd (macOS)"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed. Some features may not work."
        echo "Install with: apt-get install jq (Ubuntu/Debian)"
        echo "            : brew install jq (macOS)"
    fi
    
    echo "✓ All dependencies satisfied"
}

check_api_health() {
    print_header "Checking API Health"
    
    local health_url="${API_BASE_URL}/api/health"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$health_url")
    
    if [ "$response" -eq 200 ]; then
        echo "✓ API is healthy"
    else
        print_error "API health check failed (HTTP $response)"
        exit 1
    fi
}

generate_test_token() {
    print_header "Generating Test Token"
    
    if [ -z "$JWT_TOKEN" ]; then
        print_warning "No JWT_TOKEN provided. Tests requiring auth will fail."
        print_warning "Set JWT_TOKEN environment variable or generate one from the API"
    else
        echo "✓ Using provided JWT token"
    fi
}

run_load_test() {
    local endpoint=$1
    local method=$2
    local description=$3
    
    print_header "Load Test: $description"
    echo "Endpoint: $endpoint"
    echo "Method: $method"
    echo "Concurrent: $CONCURRENT_REQUESTS"
    echo "Total: $TOTAL_REQUESTS"
    echo ""
    
    local url="${API_BASE_URL}${endpoint}"
    
    if [ "$method" == "GET" ]; then
        ab -n "$TOTAL_REQUESTS" \
           -c "$CONCURRENT_REQUESTS" \
           -H "Authorization: Bearer $JWT_TOKEN" \
           "$url"
    else
        print_warning "Method $method not yet implemented in load test"
    fi
}

# Main execution
main() {
    print_header "Infamous Freight Enterprises - Load Testing"
    echo "API: $API_BASE_URL"
    echo "Concurrent Requests: $CONCURRENT_REQUESTS"
    echo "Total Requests: $TOTAL_REQUESTS"
    
    check_dependencies
    check_api_health
    generate_test_token
    
    # Run tests
    run_load_test "/api/health" "GET" "Health Check Endpoint"
    
    if [ -n "$JWT_TOKEN" ]; then
        run_load_test "/api/shipments" "GET" "List Shipments"
    else
        print_warning "Skipping authenticated endpoints (no JWT_TOKEN)"
    fi
    
    print_header "Load Testing Complete"
    echo "Review the results above for:"
    echo "  - Requests per second"
    echo "  - Time per request"
    echo "  - Failed requests (should be 0)"
    echo "  - Response time percentiles"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            API_BASE_URL="$2"
            shift 2
            ;;
        -c|--concurrent)
            CONCURRENT_REQUESTS="$2"
            shift 2
            ;;
        -n|--requests)
            TOTAL_REQUESTS="$2"
            shift 2
            ;;
        -t|--token)
            JWT_TOKEN="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -u, --url URL           API base URL (default: http://localhost:4000)"
            echo "  -c, --concurrent NUM    Concurrent requests (default: 50)"
            echo "  -n, --requests NUM      Total requests (default: 1000)"
            echo "  -t, --token TOKEN       JWT token for authenticated requests"
            echo "  -h, --help              Show this help message"
            echo ""
            echo "Example:"
            echo "  $0 -u http://localhost:4000 -c 100 -n 5000 -t eyJhbGc..."
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

main
