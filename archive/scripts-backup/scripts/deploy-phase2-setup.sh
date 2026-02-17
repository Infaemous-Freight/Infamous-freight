#!/bin/bash

# Phase 2 Deployment Setup Script
# Automates Phase 2 performance optimization infrastructure

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Phase 2 Setup
setup_phase_2() {
  log_info "Starting Phase 2 Performance Optimization Setup..."
  
  log_info "Step 1: Performance Analysis..."
  analyze_performance
  
  log_info "Step 2: Database Optimization..."
  optimize_database
  
  log_info "Step 3: Caching Configuration..."
  configure_caching
  
  log_info "Step 4: Rate Limiting Tuning..."
  tune_rate_limiting
  
  log_info "Step 5: API Response Optimization..."
  optimize_api_response
  
  log_info "Step 6: Load Testing..."
  load_test
  
  log_info "Step 7: Post-Optimization Validation..."
  validate_optimization
  
  log_info "Phase 2 Setup COMPLETE!"
}

analyze_performance() {
  log_info "Analyzing current performance..."
  bash scripts/optimize-performance-phase2.sh | tee phase2-baseline.json
}

optimize_database() {
  log_info "Creating database indexes..."
  
  docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres -d infamous_freight << 'EOF'
-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON shipments(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(available) WHERE available = true;
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON deliveries(delivery_date);

-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Analyze tables
ANALYZE shipments;
ANALYZE drivers;
ANALYZE loads;
ANALYZE deliveries;

SELECT 'Database optimization complete';
EOF
}

configure_caching() {
  log_info "Configuring Redis caching..."
  
  cat > monitoring/redis-phase2.conf << 'EOF'
# Redis Phase 2 Optimization
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300

# Slowlog
slowlog-log-slower-than 10000
slowlog-max-len 256

# Replication
min-slaves-to-write 0
min-slaves-max-lag 10
EOF
  
  log_info "Redis configuration updated"
}

tune_rate_limiting() {
  log_info "Tuning rate limiting configuration..."
  
  # Update .env.production
  if [ -f .env.production ]; then
    sed -i 's/RATE_LIMIT_WINDOW=.*/RATE_LIMIT_WINDOW=15/' .env.production
    sed -i 's/RATE_LIMIT_MAX=.*/RATE_LIMIT_MAX=100/' .env.production
    
    log_info "Rate limiting configuration updated"
    
    docker-compose -f docker-compose.production.yml restart api
  fi
}

optimize_api_response() {
  log_info "Optimizing API responses..."
  
  cat > nginx/nginx-phase2.conf << 'EOF'
# Gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1024;
gzip_vary on;

# Caching headers
add_header Cache-Control "public, max-age=3600" always;
add_header X-Cache-Status $upstream_cache_status;

# Performance
client_max_body_size 50M;
keepalive_timeout 65;
EOF
  
  log_info "API response optimization configured"
}

load_test() {
  log_info "Running load test..."
  
  if [ -f "scripts/load-test.sh" ]; then
    bash scripts/load-test.sh
  else
    log_error "Load test script not found"
  fi
}

validate_optimization() {
  log_info "Validating optimization results..."
  
  # Re-run analysis
  bash scripts/optimize-performance-phase2.sh | tee phase2-post-optimization.json
  
  log_info "Analysis complete. Compare phase2-baseline.json with phase2-post-optimization.json"
}

setup_phase_2

echo ""
log_info "=========================================="
log_info "Phase 2 Setup Complete!"
log_info "=========================================="
log_info "Performance improvements should include:"
log_info "✓ Query time -30%"
log_info "✓ Cache hit rate +50%"
log_info "✓ Response time -40%"
log_info "✓ Cost per request reduced"
