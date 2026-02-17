#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Script: Validate 100% Unlocked Configuration

set -e

echo "🔍 Validating 100% Unlocked Configuration..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

warnings=0
errors=0

# Check 1: Database Connection Limit
echo "📊 Checking Database Configuration..."
if [ ! -z "$DATABASE_URL" ]; then
    # Try to check max_connections (may fail if DB not accessible)
    if command -v psql &> /dev/null; then
        MAX_CONN=$(psql "$DATABASE_URL" -t -c "SHOW max_connections;" 2>/dev/null | xargs || echo "0")
        if [ "$MAX_CONN" -lt 250 ]; then
            echo -e "${RED}❌ ERROR: PostgreSQL max_connections is $MAX_CONN (need ≥250)${NC}"
            ((errors++))
        else
            echo -e "${GREEN}✅ PostgreSQL max_connections: $MAX_CONN${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Cannot check DB - psql not available${NC}"
        ((warnings++))
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not set${NC}"
    ((warnings++))
fi

# Check 2: Redis Configuration
echo ""
echo "📮 Checking Redis Configuration..."
if [ ! -z "$REDIS_URL" ]; then
    if command -v redis-cli &> /dev/null; then
        REDIS_MAX_MEM=$(redis-cli CONFIG GET maxmemory 2>/dev/null | tail -1 || echo "0")
        if [ "$REDIS_MAX_MEM" = "0" ]; then
            echo -e "${YELLOW}⚠️  Redis maxmemory not set - may cause issues under load${NC}"
            ((warnings++))
        else
            echo -e "${GREEN}✅ Redis maxmemory configured${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Cannot check Redis - redis-cli not available${NC}"
        ((warnings++))
    fi
else
    echo -e "${YELLOW}⚠️  REDIS_URL not set${NC}"
    ((warnings++))
fi

# Check 3: Rate Limit Configuration
echo ""
echo "🚦 Checking Rate Limit Configuration..."
if [ "$RATE_LIMIT_AI_MAX" -ge 1000 ]; then
    echo -e "${GREEN}✅ AI rate limit: $RATE_LIMIT_AI_MAX/min${NC}"
else
    echo -e "${YELLOW}⚠️  AI rate limit low: $RATE_LIMIT_AI_MAX/min${NC}"
fi

if [ "$RATE_LIMIT_GENERAL_MAX" -ge 10000 ]; then
    echo -e "${GREEN}✅ General rate limit: $RATE_LIMIT_GENERAL_MAX/min${NC}"
else
    echo -e "${YELLOW}⚠️  General rate limit: $RATE_LIMIT_GENERAL_MAX/min${NC}"
fi

# Check 4: Worker Concurrency
echo ""
echo "⚙️  Checking Worker Configuration..."
if [ "$WORKER_CONCURRENCY_DISPATCH" -ge 200 ]; then
    echo -e "${GREEN}✅ Dispatch workers: $WORKER_CONCURRENCY_DISPATCH${NC}"
else
    echo -e "${YELLOW}⚠️  Dispatch workers only: $WORKER_CONCURRENCY_DISPATCH${NC}"
fi

# Check 5: System Resources
echo ""
echo "💻 Checking System Resources..."

# Check available memory
if command -v free &> /dev/null; then
    AVAILABLE_MEM_GB=$(free -g | awk '/^Mem:/{print $7}')
    if [ "$AVAILABLE_MEM_GB" -lt 2 ]; then
        echo -e "${RED}❌ Low available memory: ${AVAILABLE_MEM_GB}GB (recommend ≥4GB)${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✅ Available memory: ${AVAILABLE_MEM_GB}GB${NC}"
    fi
fi

# Check CPU count
if command -v nproc &> /dev/null; then
    CPU_COUNT=$(nproc)
    if [ "$CPU_COUNT" -lt 4 ]; then
        echo -e "${YELLOW}⚠️  Only $CPU_COUNT CPU cores (recommend ≥4 for high concurrency)${NC}"
        ((warnings++))
    else
        echo -e "${GREEN}✅ CPU cores: $CPU_COUNT${NC}"
    fi
fi

# Check 6: File Upload Capacity
echo ""
echo "📁 Checking File Upload Configuration..."
if [ "$VOICE_MAX_FILE_SIZE_MB" -ge 100 ]; then
    echo -e "${GREEN}✅ Voice uploads: ${VOICE_MAX_FILE_SIZE_MB}MB${NC}"
    
    # Check disk space
    DISK_AVAILABLE_GB=$(df -BG /tmp 2>/dev/null | awk 'NR==2{print $4}' | sed 's/G//' || echo "0")
    if [ "$DISK_AVAILABLE_GB" -lt 10 ]; then
        echo -e "${YELLOW}⚠️  Low disk space: ${DISK_AVAILABLE_GB}GB (watch for large uploads)${NC}"
        ((warnings++))
    fi
fi

# Check 7: Feature Flags
echo ""
echo "🎯 Checking Feature Flags..."
ENABLED_FEATURES=0
[ "$ENABLE_AI_COMMANDS" = "true" ] && echo -e "${GREEN}✅ AI Commands${NC}" && ((ENABLED_FEATURES++))
[ "$ENABLE_VOICE_PROCESSING" = "true" ] && echo -e "${GREEN}✅ Voice Processing${NC}" && ((ENABLED_FEATURES++))
[ "$ENABLE_MARKETPLACE" = "true" ] && echo -e "${GREEN}✅ Marketplace${NC}" && ((ENABLED_FEATURES++))
[ "$ENABLE_PERFORMANCE_MONITORING" = "true" ] && echo -e "${GREEN}✅ Performance Monitoring${NC}" && ((ENABLED_FEATURES++))

echo -e "${GREEN}$ENABLED_FEATURES features enabled${NC}"

# Check 8: Security Considerations
echo ""
echo "🔒 Security Checks..."
if [ "$AI_SECURITY_MODE" = "permissive" ]; then
    echo -e "${YELLOW}⚠️  AI Security Mode is PERMISSIVE (ensure this is intentional)${NC}"
    ((warnings++))
fi

if [ "$JWT_SECRET" = "dev-secret-change-in-production" ] || [ "$JWT_SECRET" = "test-secret" ]; then
    echo -e "${RED}❌ CRITICAL: Using default JWT_SECRET in production!${NC}"
    ((errors++))
fi

# Summary
echo ""
echo "════════════════════════════════════════"
echo "📋 Validation Summary"
echo "════════════════════════════════════════"
echo -e "Errors:   ${RED}$errors${NC}"
echo -e "Warnings: ${YELLOW}$warnings${NC}"
echo ""

if [ $errors -gt 0 ]; then
    echo -e "${RED}❌ Configuration has ERRORS - fix before deploying!${NC}"
    exit 1
elif [ $warnings -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Configuration has warnings - review before deploying${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Configuration validated successfully!${NC}"
    exit 0
fi
