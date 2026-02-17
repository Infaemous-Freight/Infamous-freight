#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Quick commands for managing 100% unlocked configuration

# Source environment
source .env 2>/dev/null || true

show_help() {
    cat << EOF
🚀 Agent Unlock Management Commands

USAGE:
    ./manage-unlock.sh [COMMAND]

COMMANDS:
    status          Show current configuration status
    validate        Run validation checks
    scale-up        Apply 100% unlocked configuration
    scale-down      Reduce to recommended production limits (50%)
    scale-dev       Set safe development limits
    stats           Show real-time system statistics
    test            Run load test to verify capacity
    monitor         Start monitoring dashboard
    cost-estimate   Show estimated monthly costs
    backup-config   Backup current .env configuration

EXAMPLES:
    ./manage-unlock.sh status
    ./manage-unlock.sh validate
    ./manage-unlock.sh scale-down

EOF
}

show_status() {
    echo "📊 Current Configuration Status"
    echo "════════════════════════════════════════"
    echo "Rate Limits:"
    echo "  General: $RATE_LIMIT_GENERAL_MAX/min"
    echo "  AI: $RATE_LIMIT_AI_MAX/min"
    echo "  Auth: $RATE_LIMIT_AUTH_MAX/min"
    echo ""
    echo "Workers:"
    echo "  Dispatch: $WORKER_CONCURRENCY_DISPATCH"
    echo "  Expiry: $WORKER_CONCURRENCY_EXPIRY"
    echo "  ETA: $WORKER_CONCURRENCY_ETA"
    echo ""
    echo "Database:"
    echo "  Pool Max: $DB_POOL_MAX"
    echo "  Pool Min: $DB_POOL_MIN"
    echo ""
    echo "File Uploads:"
    echo "  Voice: ${VOICE_MAX_FILE_SIZE_MB}MB"
    echo "  Documents: ${DOCUMENT_MAX_FILE_SIZE_MB}MB"
    echo ""
    echo "Features Enabled:"
    [ "$ENABLE_AI_COMMANDS" = "true" ] && echo "  ✅ AI Commands"
    [ "$ENABLE_VOICE_PROCESSING" = "true" ] && echo "  ✅ Voice Processing"
    [ "$ENABLE_MARKETPLACE" = "true" ] && echo "  ✅ Marketplace"
    [ "$ENABLE_PERFORMANCE_MONITORING" = "true" ] && echo "  ✅ Performance Monitoring"
}

scale_down() {
    echo "📉 Scaling down to recommended production limits (50%)..."
    
    cat > .env.scale-temp << EOF
# Scaled down to 50% (Production Recommended)
RATE_LIMIT_GENERAL_MAX=5000
RATE_LIMIT_AI_MAX=500
RATE_LIMIT_AUTH_MAX=100
RATE_LIMIT_BILLING_MAX=200
RATE_LIMIT_VOICE_MAX=200

WORKER_CONCURRENCY_DISPATCH=100
WORKER_CONCURRENCY_EXPIRY=50
WORKER_CONCURRENCY_ETA=50

DB_POOL_MAX=100
DB_POOL_MIN=10

VOICE_MAX_FILE_SIZE_MB=50
DOCUMENT_MAX_FILE_SIZE_MB=100
IMAGE_MAX_FILE_SIZE_MB=25

AI_SECURITY_MODE=strict
AI_PARALLEL_REQUESTS=50
AI_TIMEOUT_MS=60000
EOF
    
    echo "✅ Generated scaled-down configuration in .env.scale-temp"
    echo "Review and merge into .env manually"
}

scale_dev() {
    echo "🔧 Setting safe development limits..."
    echo "Using synthetic AI provider and reasonable limits..."
}

show_stats() {
    echo "📈 Real-time System Statistics"
    echo "════════════════════════════════════════"
    
    # Memory
    if command -v free &> /dev/null; then
        echo "Memory:"
        free -h | grep -E "Mem|Swap"
        echo ""
    fi
    
    # CPU
    if command -v mpstat &> /dev/null; then
        echo "CPU Usage:"
        mpstat 1 1 | tail -2
        echo ""
    fi
    
    # Disk
    echo "Disk Usage:"
    df -h / /tmp 2>/dev/null || df -h
    echo ""
    
    # Processes
    echo "Node Processes:"
    ps aux | grep -E "node|pnpm" | grep -v grep | wc -l
    echo ""
    
    # Network (if available)
    if command -v netstat &> /dev/null; then
        echo "Active Connections:"
        netstat -an | grep ESTABLISHED | wc -l
    fi
}

run_load_test() {
    echo "🧪 Running load test..."
    
    if [ ! -f "load-test.k6.js" ]; then
        echo "❌ load-test.k6.js not found"
        exit 1
    fi
    
    if ! command -v k6 &> /dev/null; then
        echo "❌ k6 not installed. Install from: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
    echo "Testing with 100 VUs for 2 minutes..."
    k6 run --vus 100 --duration 2m load-test.k6.js
}

cost_estimate() {
    echo "💰 Estimated Monthly Costs (100% Unlocked)"
    echo "════════════════════════════════════════"
    echo ""
    echo "Infrastructure (Railway.app):"
    echo "  PostgreSQL (8GB):      \$75-150/mo"
    echo "  Redis (4GB):           \$35-75/mo"
    echo "  API Compute (16GB):    \$70-250/mo"
    echo "  ────────────────────────────────"
    echo "  Subtotal:              \$180-475/mo"
    echo ""
    echo "⚠️  AI Provider Costs (if enabled):"
    echo "  OpenAI GPT-4 @ 1000/min: \$1,800/hour (!)"
    echo "  OpenAI GPT-3.5 @ 1000/min: \$120/hour"
    echo "  Synthetic (current): \$0"
    echo ""
    echo "Recommendation: Use aggressive rate limiting"
    echo "or implement per-user quotas for AI features."
}

backup_config() {
    BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env "$BACKUP_FILE"
    echo "✅ Configuration backed up to: $BACKUP_FILE"
}

# Main
case "${1:-}" in
    status)
        show_status
        ;;
    validate)
        ./validate-unlocked-config.sh
        ;;
    scale-down)
        scale_down
        ;;
    scale-dev)
        scale_dev
        ;;
    stats)
        show_stats
        ;;
    test)
        run_load_test
        ;;
    cost-estimate)
        cost_estimate
        ;;
    backup-config)
        backup_config
        ;;
    monitor)
        echo "🖥️  Start monitoring with:"
        echo "  - Metrics: http://localhost:9090/metrics"
        echo "  - Logs: pnpm logs:api"
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
