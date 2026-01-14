#!/bin/bash
# Production Startup Script
# Starts all production services with monitoring

set -euo pipefail

# Configuration
export NODE_ENV=production
export API_PORT=4000

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $*"
}

success() {
    echo -e "${GREEN}✓${NC} $*"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $*"
}

# Pre-flight checks
log "Running pre-flight checks..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    warn ".env.production not found, copying from template..."
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
        log "Please edit .env.production with your production secrets"
        exit 1
    else
        warn "No environment template found!"
        exit 1
    fi
fi

# Load environment
set -a
source .env.production
set +a

success "Environment loaded"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    warn "Node.js version $NODE_VERSION is too old. Please upgrade to v18 or higher."
    exit 1
fi

success "Node.js version: v$NODE_VERSION"

# Check if prom-client is installed
if ! node -e "require('prom-client')" 2>/dev/null; then
    warn "Installing prom-client for metrics..."
    npm install --no-save prom-client
fi

# Start services based on mode
MODE="${1:-all}"

case "$MODE" in
    api)
        log "Starting API only..."
        node api/production-server.js
        ;;
    
    monitoring)
        log "Starting monitoring stack..."
        if command -v docker-compose &> /dev/null; then
            docker-compose -f docker-compose.monitoring.yml up -d
            success "Monitoring stack started"
            log "Prometheus: http://localhost:9090"
            log "Grafana: http://localhost:3001 (admin/admin)"
            log "AlertManager: http://localhost:9093"
        else
            warn "Docker Compose not found. Install Docker to use monitoring stack."
        fi
        ;;
    
    all)
        log "Starting full production stack..."
        
        # Start API in background
        log "Starting API..."
        node api/production-server.js &
        API_PID=$!
        echo $API_PID > /tmp/infamous-api.pid
        
        # Wait for API to be ready
        sleep 3
        
        if curl -sf http://localhost:4000/api/health > /dev/null; then
            success "API started (PID: $API_PID)"
        else
            warn "API may not be ready yet"
        fi
        
        # Start monitoring if Docker is available
        if command -v docker-compose &> /dev/null; then
            log "Starting monitoring stack..."
            docker-compose -f docker-compose.monitoring.yml up -d
            success "Monitoring stack started"
        fi
        
        # Start health monitor
        if [ -f "scripts/health-monitor.sh" ]; then
            log "Starting health monitor..."
            ./scripts/health-monitor.sh &
            MONITOR_PID=$!
            echo $MONITOR_PID > /tmp/infamous-monitor.pid
            success "Health monitor started (PID: $MONITOR_PID)"
        fi
        
        log "═══════════════════════════════════════"
        log "Production stack started successfully!"
        log "═══════════════════════════════════════"
        echo ""
        log "Services:"
        log "  API:         http://localhost:4000"
        log "  Prometheus:  http://localhost:9090"
        log "  Grafana:     http://localhost:3001"
        log "  Metrics:     http://localhost:4000/api/metrics"
        echo ""
        log "To stop: ./scripts/stop-production.sh"
        log "To view logs: tail -f /tmp/infamous-*.log"
        echo ""
        
        # Keep running
        wait $API_PID
        ;;
    
    *)
        echo "Usage: $0 {api|monitoring|all}"
        exit 1
        ;;
esac
