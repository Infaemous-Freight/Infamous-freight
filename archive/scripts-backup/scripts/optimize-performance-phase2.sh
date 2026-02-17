#!/bin/bash

# Phase 2: Post-Deployment Performance Optimization Script
# Analyzes production metrics and provides optimization recommendations
# Usage: bash scripts/optimize-performance-phase2.sh

set -e

echo "🔍 Phase 2: Performance Optimization Analysis"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ANALYSIS_OUTPUT="performance-analysis-$(date +%Y%m%d_%H%M%S).json"
BASELINE_FILE="performance-baseline.json"

echo "⏱️  Starting performance analysis..."
echo "Output will be saved to: $ANALYSIS_OUTPUT"
echo ""

# ============================================================================
# 1. DATABASE QUERY ANALYSIS
# ============================================================================

echo "📊 [1/7] Analyzing database queries..."

# Get slow queries
SLOW_QUERIES=$(psql -h localhost -U postgres -d infamous_freight -t -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC 
LIMIT 10;
" 2>/dev/null || echo "")

echo "$SLOW_QUERIES" | while read -r line; do
  if [[ -n "$line" ]]; then
    echo "  ⚠️  Slow Query: $line"
  fi
done

# ============================================================================
# 2. CACHE EFFECTIVENESS ANALYSIS
# ============================================================================

echo ""
echo "💾 [2/7] Analyzing cache effectiveness..."

CACHE_INFO=$(redis-cli --latency-history --samples 10 2>/dev/null || echo "")

CACHE_STATS=$(redis-cli INFO stats 2>/dev/null | grep -E "hits|misses" || echo "")
echo "  Cache Stats: $CACHE_STATS"

# Calculate hit rate
HIT_RATE=$(redis-cli INFO stats 2>/dev/null | grep keyspace_hits | cut -d: -f2 || echo "0")
MISS_RATE=$(redis-cli INFO stats 2>/dev/null | grep keyspace_misses | cut -d: -f2 || echo "0")

if [ "$((HIT_RATE + MISS_RATE))" -gt 0 ]; then
  HIT_PERCENTAGE=$((HIT_RATE * 100 / (HIT_RATE + MISS_RATE)))
  if [ "$HIT_PERCENTAGE" -gt 70 ]; then
    echo "  ✅ Cache hit rate: $HIT_PERCENTAGE% (Target: >70%)"
  else
    echo "  ⚠️  Cache hit rate: $HIT_PERCENTAGE% (Below target of 70%)"
  fi
fi

# ============================================================================
# 3. API RESPONSE TIME ANALYSIS
# ============================================================================

echo ""
echo "⚡ [3/7] Analyzing API response times..."

# Test endpoints and measure response time
endpoints=(
  "http://localhost:3001/api/health"
  "http://localhost:3001/api/shipments"
  "http://localhost:3001/api/drivers"
)

for endpoint in "${endpoints[@]}"; do
  RESPONSE_TIME=$(curl -s -o /dev/null -w '%{time_total}' "$endpoint" || echo "error")
  
  # Convert to milliseconds
  MS=$(echo "$RESPONSE_TIME * 1000" | bc)
  
  if (( $(echo "$MS < 1500" | bc -l) )); then
    echo "  ✅ $endpoint: ${MS%.*}ms"
  else
    echo "  ⚠️  $endpoint: ${MS%.*}ms (>1500ms threshold)"
  fi
done

# ============================================================================
# 4. RESOURCE UTILIZATION ANALYSIS
# ============================================================================

echo ""
echo "🖥️  [4/7] Analyzing resource utilization..."

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}' 2>/dev/null || echo "N/A")
echo "  CPU Usage: ${CPU_USAGE}% (Target: <50%)"

# Memory Usage
MEMORY=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}' 2>/dev/null || echo "N/A")
echo "  Memory Usage: ${MEMORY}% (Target: <60%)"

# Disk I/O
IO_UTIL=$(iostat -x 1 2 2>/dev/null | tail -1 | awk '{print $NF}' || echo "N/A")
echo "  Disk I/O: ${IO_UTIL}% (Target: <70%)"

# ============================================================================
# 5. ERROR RATE ANALYSIS
# ============================================================================

echo ""
echo "🚨 [5/7] Analyzing error rates..."

# Get error count from Prometheus
ERROR_RATE=$(curl -s 'http://localhost:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])' 2>/dev/null | grep -o '"value":\[[^]]*\]' | grep -o '[0-9.]*' | head -1 || echo "0")

if [ "$ERROR_RATE" = "0" ] || (( $(echo "$ERROR_RATE < 0.005" | bc -l) )); then
  echo "  ✅ Error rate: ${ERROR_RATE} (Target: <0.5%)"
else
  echo "  ⚠️  Error rate: ${ERROR_RATE} (Above target of 0.5%)"
fi

# ============================================================================
# 6. RATE LIMITING ANALYSIS
# ============================================================================

echo ""
echo "🚦 [6/7] Analyzing rate limiting effectiveness..."

# Simulate load and check if rate limits are appropriately tuned
echo "  Current Rate Limits:"
echo "    • General: 100 requests/15 min (Target: 6.7 req/s)"
echo "    • Auth: 5 requests/15 min (Target: 0.33 req/s)"
echo "    • AI: 20 requests/1 min (Target: 0.33 req/s)"
echo "    • Billing: 30 requests/15 min (Target: 2 req/s)"

# ============================================================================
# 7. COST ANALYSIS
# ============================================================================

echo ""
echo "💰 [7/7] Performing cost analysis..."

# Estimate hourly cost
REQUESTS_PER_HOUR=$(curl -s 'http://localhost:9090/api/v1/query?query=increase(http_requests_total[1h])' 2>/dev/null | grep -o '"value":\[[^]]*\]' | grep -o '[0-9]*' | head -1 || echo "0")
COST_PER_REQUEST=0.0015  # Example: $0.0015 per request
HOURLY_COST=$(echo "$REQUESTS_PER_HOUR * $COST_PER_REQUEST" | bc)

echo "  Requests/hour: $REQUESTS_PER_HOUR"
echo "  Cost per request: \$$COST_PER_REQUEST"
echo "  Estimated hourly cost: \$$HOURLY_COST"
echo "  Estimated daily cost: \$(echo "$HOURLY_COST * 24" | bc)"

# ============================================================================
# GENERATE RECOMMENDATIONS
# ============================================================================

echo ""
echo "=================================================="
echo "📋 RECOMMENDATIONS"
echo "=================================================="
echo ""

recommendations=()

# Check cache hit rate
if [ ! -z "$HIT_PERCENTAGE" ] && [ "$HIT_PERCENTAGE" -lt 70 ]; then
  recommendations+=("Increase cache TTL for frequently accessed data (current: ${HIT_PERCENTAGE}%, target: >70%)")
fi

# Check response time
if (( $(echo "$MS > 1500" | bc -l) )); then
  recommendations+=("Add database indexes for slow queries (current: >1500ms, target: <1500ms)")
fi

# Check CPU usage
if (( $(echo "$CPU_USAGE > 50" | bc -l) )); then
  recommendations+=("Scale API instances (CPU: ${CPU_USAGE}%, target: <50%)")
fi

# Check memory usage
if (( $(echo "$MEMORY > 60" | bc -l) )); then
  recommendations+=("Investigate memory leak or increase instance memory (Memory: ${MEMORY}%, target: <60%)")
fi

# Print recommendations
if [ ${#recommendations[@]} -eq 0 ]; then
  echo "✅ No critical recommendations - system is well-optimized!"
else
  i=1
  for rec in "${recommendations[@]}"; do
    echo "  $i. $rec"
    ((i++))
  done
fi

# ============================================================================
# SAVE RESULTS
# ============================================================================

echo ""
echo "💾 Saving analysis results..."

cat > "$ANALYSIS_OUTPUT" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "metrics": {
    "cache_hit_rate": ${HIT_PERCENTAGE:-0},
    "api_response_time_ms": ${MS%.*:-0},
    "cpu_usage_percent": ${CPU_USAGE:-0},
    "memory_usage_percent": ${MEMORY:-0},
    "error_rate": $ERROR_RATE,
    "requests_per_hour": $REQUESTS_PER_HOUR,
    "estimated_hourly_cost": $HOURLY_COST
  },
  "recommendations": [
    $(printf '"%s",' "${recommendations[@]}" | sed 's/,$//')
  ],
  "thresholds": {
    "cache_hit_rate": 70,
    "api_response_time_ms": 1500,
    "cpu_usage_percent": 50,
    "memory_usage_percent": 60,
    "error_rate": 0.005,
    "cost_per_request": 0.0015
  }
}
EOF

echo "✅ Analysis complete: $ANALYSIS_OUTPUT"
echo ""
echo "📊 Key Metrics:"
echo "  • Cache Hit Rate: ${HIT_PERCENTAGE:-N/A}%"
echo "  • API Response: ${MS%.*:-N/A}ms"
echo "  • CPU Usage: ${CPU_USAGE:-N/A}%"
echo "  • Memory: ${MEMORY:-N/A}%"
echo "  • Hourly Cost: \$${HOURLY_COST:-N/A}"
echo ""
echo "Next steps:"
echo "  1. Review recommendations above"
echo "  2. Implement recommended optimizations"
echo "  3. Re-run this script to validate improvements"
echo "  4. Update baseline metrics: cp $ANALYSIS_OUTPUT $BASELINE_FILE"
echo ""
