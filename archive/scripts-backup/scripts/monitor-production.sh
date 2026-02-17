#!/bin/bash

# 📊 PRODUCTION MONITORING DASHBOARD
# Real-time production monitoring

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║         📊 PRODUCTION MONITORING DASHBOARD 📊                 ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

WEB_URL="https://infamous-freight-enterprises-git-main-santorio-miles-projects.vercel.app"
API_URL="https://infamous-freight-api.fly.dev"

print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "ok" ]; then
        echo -e "${GREEN}✅ OK${NC}   - $message"
    elif [ "$status" = "warn" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC} - $message"
    else
        echo -e "${RED}❌ DOWN${NC} - $message"
    fi
}

check_service() {
    local name=$1
    local url=$2
    
    if curl -Is --max-time 5 "$url" 2>/dev/null | head -1 | grep -q "200\|301\|302"; then
        print_status "ok" "$name is responding"
        return 0
    else
        print_status "error" "$name is not responding"
        return 1
    fi
}

# Main monitoring loop
while true; do
    clear
    
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║         📊 PRODUCTION HEALTH CHECK 📊                         ║"
    echo "║  $(date '+%Y-%m-%d %H:%M:%S')                                 ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "SERVICE STATUS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    check_service "Web Frontend" "$WEB_URL/"
    check_service "API Backend" "$API_URL/api/health"
    check_service "Auth Endpoint" "$API_URL/api/auth/me"
    check_service "AI Endpoint" "$API_URL/api/ai/health"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "RESPONSE TIMES"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Measure API response time
    start=$(date +%s%N)
    curl -s "$API_URL/api/health" > /dev/null 2>&1
    end=$(date +%s%N)
    api_time=$(( (end - start) / 1000000 ))
    
    if [ $api_time -lt 500 ]; then
        echo -e "${GREEN}API:${NC} ${api_time}ms (excellent)"
    elif [ $api_time -lt 1000 ]; then
        echo -e "${YELLOW}API:${NC} ${api_time}ms (good)"
    else
        echo -e "${RED}API:${NC} ${api_time}ms (slow)"
    fi
    
    # Measure web response time
    start=$(date +%s%N)
    curl -s "$WEB_URL/" > /dev/null 2>&1
    end=$(date +%s%N)
    web_time=$(( (end - start) / 1000000 ))
    
    if [ $web_time -lt 1500 ]; then
        echo -e "${GREEN}Web:${NC} ${web_time}ms (excellent)"
    elif [ $web_time -lt 3000 ]; then
        echo -e "${YELLOW}Web:${NC} ${web_time}ms (good)"
    else
        echo -e "${RED}Web:${NC} ${web_time}ms (slow)"
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "QUICK ACTIONS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  [L] View Fly.io logs"
    echo "  [V] Open Vercel dashboard"
    echo "  [S] Run smoke tests"
    echo "  [R] Rollback deployment"
    echo "  [Q] Quit monitoring"
    echo ""
    echo "Refreshing in 30 seconds... (Press Ctrl+C to stop)"
    
    # Wait with timeout
    read -t 30 -n 1 action 2>/dev/null || true
    
    case $action in
        l|L)
            flyctl logs --follow
            ;;
        v|V)
            xdg-open "https://vercel.com/dashboard" 2>/dev/null || \
            open "https://vercel.com/dashboard" 2>/dev/null || \
            echo "Open manually: https://vercel.com/dashboard"
            ;;
        s|S)
            bash "$(dirname "$0")/smoke-test.sh"
            read -p "Press Enter to continue..."
            ;;
        r|R)
            bash "$(dirname "$0")/rollback.sh"
            read -p "Press Enter to continue..."
            ;;
        q|Q)
            echo "Exiting monitoring..."
            exit 0
            ;;
    esac
done
