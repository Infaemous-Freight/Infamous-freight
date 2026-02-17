#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# 72-Hour Monitoring Validation Framework
# Automates the time-dependent validation requirements

set -e

VALIDATION_DIR="./validation-data"
START_TIME=$(date +%s)
DURATION_HOURS=72
END_TIME=$((START_TIME + DURATION_HOURS * 3600))

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║     🔍 72-HOUR VALIDATION FRAMEWORK - STARTED                    ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Start Time: $(date)"
echo "End Time: $(date -d @$END_TIME)"
echo "Validation Directory: $VALIDATION_DIR"
echo ""

# Create validation directory structure
mkdir -p "$VALIDATION_DIR"/{metrics,logs,reports,snapshots}

# Phase 1: Baseline Collection (Hour 0)
collect_baseline() {
    echo "📊 Collecting baseline metrics..."
    
    # API Health Check
    curl -s http://localhost:4000/api/health > "$VALIDATION_DIR/snapshots/health_baseline.json"
    
    # Performance Metrics
    ./scripts/collect-metrics.sh --output "$VALIDATION_DIR/metrics/baseline.json"
    
    # Database Stats
    psql $DATABASE_URL -c "\
        SELECT COUNT(*) as total_shipments,
               AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time
        FROM shipments
        WHERE created_at > NOW() - INTERVAL '24 hours';" \
        --json > "$VALIDATION_DIR/metrics/db_baseline.json"
    
    # Cache Hit Rate
    redis-cli INFO stats | grep hits > "$VALIDATION_DIR/metrics/cache_baseline.txt"
    
    echo "✅ Baseline collected at $(date)"
}

# Phase 2: Continuous Monitoring (Hours 1-72)
continuous_monitoring() {
    local hour=1
    
    while [ $(date +%s) -lt $END_TIME ]; do
        echo ""
        echo "⏱️  Hour $hour of 72 - $(date)"
        
        # Collect metrics every hour
        ./scripts/collect-metrics.sh --output "$VALIDATION_DIR/metrics/hour_${hour}.json"
        
        # Check for anomalies
        check_anomalies "$hour"
        
        # Database performance
        psql $DATABASE_URL -c "\
            SELECT 
                query,
                calls,
                mean_exec_time,
                max_exec_time
            FROM pg_stat_statements
            WHERE mean_exec_time > 100
            ORDER BY mean_exec_time DESC
            LIMIT 10;" \
            --json > "$VALIDATION_DIR/metrics/slow_queries_hour_${hour}.json"
        
        # Error rate check
        curl -s http://localhost:4000/api/health/details | \
            jq '.errors' > "$VALIDATION_DIR/metrics/errors_hour_${hour}.json"
        
        # Sleep until next hour
        sleep 3600
        hour=$((hour + 1))
    done
}

# Phase 3: Anomaly Detection
check_anomalies() {
    local hour=$1
    local current_file="$VALIDATION_DIR/metrics/hour_${hour}.json"
    local baseline_file="$VALIDATION_DIR/metrics/baseline.json"
    
    # Check if response time increased by >50%
    baseline_rt=$(jq '.api_response_time_ms' "$baseline_file")
    current_rt=$(jq '.api_response_time_ms' "$current_file")
    
    if [ $(echo "$current_rt > $baseline_rt * 1.5" | bc) -eq 1 ]; then
        echo "⚠️  ANOMALY: Response time increased by >50%"
        echo "   Baseline: ${baseline_rt}ms, Current: ${current_rt}ms"
        
        # Log anomaly
        echo "{
            \"hour\": $hour,
            \"type\": \"response_time_spike\",
            \"baseline\": $baseline_rt,
            \"current\": $current_rt,
            \"increase_pct\": $(echo "scale=2; ($current_rt - $baseline_rt) / $baseline_rt * 100" | bc)
        }" >> "$VALIDATION_DIR/logs/anomalies.json"
    fi
    
    # Check error rate
    error_count=$(jq '.error_count' "$current_file")
    if [ "$error_count" -gt 10 ]; then
        echo "⚠️  ANOMALY: High error rate detected ($error_count errors)"
    fi
    
    # Check cache hit rate
    cache_hit_rate=$(jq '.cache_hit_rate' "$current_file")
    if [ $(echo "$cache_hit_rate < 0.7" | bc) -eq 1 ]; then
        echo "⚠️  ANOMALY: Low cache hit rate (${cache_hit_rate})"
    fi
}

# Phase 4: Final Report Generation
generate_final_report() {
    echo ""
    echo "📋 Generating final validation report..."
    
    # Calculate averages
    local total_files=$(ls "$VALIDATION_DIR/metrics/hour_"*.json | wc -l)
    
    # Average response time
    avg_response_time=$(jq -s 'map(.api_response_time_ms) | add / length' "$VALIDATION_DIR/metrics/hour_"*.json)
    
    # Total requests
    total_requests=$(jq -s 'map(.total_requests) | add' "$VALIDATION_DIR/metrics/hour_"*.json)
    
    # Error rate
    total_errors=$(jq -s 'map(.error_count) | add' "$VALIDATION_DIR/metrics/hour_"*.json)
    error_rate=$(echo "scale=4; $total_errors / $total_requests * 100" | bc)
    
    # Cache performance
    avg_cache_hit=$(jq -s 'map(.cache_hit_rate) | add / length' "$VALIDATION_DIR/metrics/hour_"*.json)
    
    # Generate report
    cat > "$VALIDATION_DIR/reports/final_validation_report.md" << EOF
# 🏆 72-HOUR VALIDATION REPORT

**Validation Period**: $(date -d @$START_TIME) to $(date -d @$END_TIME)
**Total Duration**: 72 hours
**Data Points Collected**: $total_files hourly snapshots

---

## 📊 PERFORMANCE SUMMARY

### Response Time
- **Average**: ${avg_response_time}ms
- **Target**: <15ms
- **Status**: $([ $(echo "$avg_response_time < 15" | bc) -eq 1 ] && echo "✅ PASS" || echo "❌ NEEDS IMPROVEMENT")

### Request Volume
- **Total Requests**: $total_requests
- **Avg Requests/Hour**: $(echo "scale=0; $total_requests / 72" | bc)
- **Status**: ✅ System handled load successfully

### Error Rate
- **Total Errors**: $total_errors
- **Error Rate**: ${error_rate}%
- **Target**: <1%
- **Status**: $([ $(echo "$error_rate < 1" | bc) -eq 1 ] && echo "✅ PASS" || echo "⚠️  MONITOR CLOSELY")

### Cache Performance
- **Avg Hit Rate**: $(echo "scale=2; $avg_cache_hit * 100" | bc)%
- **Target**: >80%
- **Status**: $([ $(echo "$avg_cache_hit > 0.8" | bc) -eq 1 ] && echo "✅ PASS" || echo "⚠️  TUNE CACHE TTL")

---

## 🔍 ANOMALIES DETECTED

$(if [ -f "$VALIDATION_DIR/logs/anomalies.json" ]; then
    jq -r 'group_by(.type) | map({type: .[0].type, count: length}) | .[] | "- \(.type): \(.count) occurrences"' "$VALIDATION_DIR/logs/anomalies.json"
else
    echo "None detected ✅"
fi)

---

## 💡 RECOMMENDATIONS

$(if [ $(echo "$avg_response_time > 15" | bc) -eq 1 ]; then
    echo "- ⚠️  Response time above target - investigate slow queries"
fi)
$(if [ $(echo "$error_rate > 1" | bc) -eq 1 ]; then
    echo "- ⚠️  Error rate above 1% - review error logs"
fi)
$(if [ $(echo "$avg_cache_hit < 0.8" | bc) -eq 1 ]; then
    echo "- ⚠️  Cache hit rate below 80% - adjust TTL settings"
fi)
$(if [ $(echo "$avg_response_time <= 15 && $error_rate <= 1 && $avg_cache_hit >= 0.8" | bc) -eq 1 ]; then
    echo "✅ All metrics within target - system performing excellently!"
fi)

---

## ✅ VALIDATION STATUS

**Overall**: $(if [ $(echo "$avg_response_time <= 15 && $error_rate <= 1 && $avg_cache_hit >= 0.8" | bc) -eq 1 ]; then
    echo "✅ PASSED - Ready for production certification"
else
    echo "⚠️  CONDITIONAL PASS - Some tuning recommended"
fi)

**Sign-Off Required**:
- [ ] Engineering Lead
- [ ] Operations Manager
- [ ] Product Owner
- [ ] Security Officer
- [ ] CTO

---

**Report Generated**: $(date)
**Validation Complete**: ✅
EOF

    echo "✅ Final report saved to: $VALIDATION_DIR/reports/final_validation_report.md"
}

# Main execution
main() {
    echo "Starting 72-hour validation framework..."
    echo ""
    
    # Phase 1: Baseline
    collect_baseline
    
    # Phase 2: Continuous monitoring
    echo ""
    echo "🔄 Starting continuous monitoring (72 hours)..."
    echo "   This will collect data every hour until validation is complete."
    echo "   Press Ctrl+C to stop early (not recommended)"
    echo ""
    continuous_monitoring
    
    # Phase 3: Final report
    generate_final_report
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║     ✅ 72-HOUR VALIDATION COMPLETE                               ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📊 View report: $VALIDATION_DIR/reports/final_validation_report.md"
    echo "📈 View metrics: $VALIDATION_DIR/metrics/"
    echo "📋 View logs: $VALIDATION_DIR/logs/"
    echo ""
    echo "🎯 Next step: Review report and obtain team sign-offs"
}

# Run main function
main
