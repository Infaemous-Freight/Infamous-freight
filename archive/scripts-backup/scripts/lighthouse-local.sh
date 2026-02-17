#!/bin/bash

# 🚀 Lighthouse CI Local Testing Script
# Runs Lighthouse audits locally with multiple modes

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONFIG_FILE=".lighthouserc.json"
REPORT_DIR=".lighthouseci"
WEB_DIR="web"
PORT=3000
MODE="${1:-full}"
VERBOSE="${VERBOSE:-false}"

# Check if config exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo -e "${RED}❌ Error: $CONFIG_FILE not found${NC}"
  echo "Run this script from project root"
  exit 1
fi

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_header() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
}

print_section() {
  echo ""
  echo "────────────────────────────────────────────────────────────────────"
  echo "  $1"
  echo "────────────────────────────────────────────────────────────────────"
  echo ""
}

# ============================================================================
# PORT MANAGEMENT
# ============================================================================

check_port_available() {
  if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    return 1  # Port in use
  else
    return 0  # Port available
  fi
}

kill_port() {
  if lsof -ti:$PORT >/dev/null 2>&1; then
    log_warn "Killing process on port $PORT..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 2
  fi
}

# ============================================================================
# BUILD & STARTUP
# ============================================================================

build_web_app() {
  print_section "Building Web Application"
  
  cd "$WEB_DIR"
  
  if [ "$VERBOSE" = "true" ]; then
    npm run build
  else
    npm run build > /dev/null 2>&1
  fi
  
  log_success "Web app built"
  cd ".."
}

start_dev_server() {
  print_section "Starting Development Server (port $PORT)"
  
  kill_port
  
  cd "$WEB_DIR"
  
  if [ "$VERBOSE" = "true" ]; then
    npm start &
  else
    npm start > /dev/null 2>&1 &
  fi
  
  SERVER_PID=$!
  cd ".."
  
  # Wait for server to start
  log_info "Waiting for server to be ready..."
  for i in {1..30}; do
    if curl -s http://localhost:$PORT > /dev/null 2>&1; then
      log_success "Server ready on http://localhost:$PORT"
      return 0
    fi
    sleep 1
  done
  
  log_error "Server failed to start after 30 seconds"
  exit 1
}

stop_dev_server() {
  if [ ! -z "$SERVER_PID" ]; then
    log_info "Stopping dev server..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    sleep 1
  fi
}

# ============================================================================
# LIGHTHOUSE AUDITS
# ============================================================================

run_lighthouse_audit() {
  print_section "Running Lighthouse Audit"
  
  if ! command -v lhci &> /dev/null; then
    log_warn "@lhci/cli not installed globally"
    log_info "Installing @lhci/cli globally..."
    npm install -g @lhci/cli@0.9.x
  fi
  
  # Create report directory
  mkdir -p "$REPORT_DIR"
  
  # Run audit
  if [ "$VERBOSE" = "true" ]; then
    lhci autorun --config="$CONFIG_FILE"
  else
    lhci autorun --config="$CONFIG_FILE" 2>&1 | tail -20
  fi
  
  log_success "Lighthouse audit completed"
}

generate_summary() {
  print_section "Audit Summary"
  
  if [ -f "$REPORT_DIR/lh-results-manifest.json" ]; then
    # Extract scores from JSON
    python3 << 'EOF'
import json
import sys
import os

try:
    with open('.lighthouseci/lh-results-manifest.json') as f:
        manifest = json.load(f)
    
    print("📊 Lighthouse Results\n")
    print("Page Audited: " + manifest[0].get('url', 'N/A'))
    print("Timestamp: " + manifest[0].get('requestedUrl', 'N/A'))
    
    # Try to read the actual results
    result_files = [f for f in os.listdir('.lighthouseci') if f.endswith('.json') and 'manifest' not in f]
    
    if result_files:
        with open(f'.lighthouseci/{result_files[0]}') as f:
            result = json.load(f)
        
        print("\n📈 Scores:")
        scores = result.get('categories', {})
        for category, data in scores.items():
            score = data.get('score', 0)
            percentage = int(score * 100)
            bar_length = 20
            filled = int(bar_length * percentage / 100)
            bar = '█' * filled + '░' * (bar_length - filled)
            status = '🟢' if percentage >= 80 else '🟡' if percentage >= 50 else '🔴'
            print(f"  {status} {category:25} {bar} {percentage:3}%")
except Exception as e:
    print(f"⚠️  Could not parse results: {e}")
    sys.exit(1)
EOF
  else
    log_warn "No results found. Check audit output above."
  fi
}

# ============================================================================
# MODES
# ============================================================================

mode_full() {
  print_header "🚀 FULL LIGHTHOUSE AUDIT (Complete)"
  
  build_web_app
  start_dev_server
  run_lighthouse_audit
  generate_summary
  stop_dev_server
  
  log_success "Full audit completed!"
}

mode_quick() {
  print_header "⚡ QUICK AUDIT (Single run)"
  
  build_web_app
  start_dev_server
  
  print_section "Running Quick Audit"
  mkdir -p "$REPORT_DIR"
  
  lhci autorun --config="$CONFIG_FILE" --wizard=basic 2>&1 | tail -20
  
  generate_summary
  stop_dev_server
  
  log_success "Quick audit completed!"
}

mode_server_only() {
  print_header "🔌 SERVER ONLY (Manual audit)"
  
  build_web_app
  start_dev_server
  
  echo ""
  log_success "Server running on http://localhost:$PORT"
  echo "Run audit manually:"
  echo "  lhci autorun --config=.lighthouserc.json"
  echo ""
  echo "Press Ctrl+C to stop server"
  wait
}

mode_analyze() {
  print_header "📊 ANALYZE PREVIOUS RESULTS"
  
  if [ ! -f "$REPORT_DIR/lh-results-manifest.json" ]; then
    log_error "No previous results found"
    exit 1
  fi
  
  generate_summary
  
  print_section "Detailed Results"
  if [ -f "$REPORT_DIR/lh-results.html" ]; then
    log_success "HTML report available at:"
    echo "  $REPORT_DIR/lh-results.html"
    
    if command -v open &> /dev/null; then
      log_info "Opening report..."
      open "$REPORT_DIR/lh-results.html"
    fi
  fi
}

mode_compare() {
  print_header "🔄 RUN & COMPARE"
  
  if [ ! -d "$REPORT_DIR/baseline" ]; then
    log_warn "No baseline found. Running audit to create baseline..."
    mkdir -p "$REPORT_DIR/baseline"
    
    build_web_app
    start_dev_server
    
    print_section "Creating Baseline"
    lhci autorun --config="$CONFIG_FILE" 2>&1 | tail -20
    
    cp "$REPORT_DIR/lh-results-manifest.json" "$REPORT_DIR/baseline/manifest.json" 2>/dev/null || true
    
    stop_dev_server
    log_success "Baseline created!"
  else
    log_info "Baseline exists. Running audit to compare..."
    
    build_web_app
    start_dev_server
    run_lighthouse_audit
    stop_dev_server
    
    print_section "Comparison"
    log_info "Baseline: $REPORT_DIR/baseline/manifest.json"
    log_info "Current:  $REPORT_DIR/lh-results-manifest.json"
    echo ""
    echo "Use these files to compare results manually."
  fi
}

# ============================================================================
# CLEANUP
# ============================================================================

cleanup() {
  echo ""
  log_info "Cleaning up..."
  stop_dev_server
}

trap cleanup EXIT

# ============================================================================
# MAIN
# ============================================================================

show_usage() {
  echo ""
  echo "Usage: $0 [MODE] [OPTIONS]"
  echo ""
  echo "Modes:"
  echo "  full        - Complete audit with build & server (default)"
  echo "  quick       - Single run quick audit"
  echo "  server      - Start server only (manual audit)"
  echo "  analyze     - Analyze previous results"
  echo "  compare     - Run audit and compare with baseline"
  echo ""
  echo "Options:"
  echo "  VERBOSE=true  - Show verbose output"
  echo ""
  echo "Examples:"
  echo "  $0                              # Full audit"
  echo "  $0 quick                        # Quick audit"
  echo "  $0 server                       # Start server for manual testing"
  echo "  VERBOSE=true $0 full            # Full audit with verbose output"
  echo "  $0 compare                      # Run and compare with baseline"
  echo ""
}

case "$MODE" in
  full)
    mode_full
    ;;
  quick)
    mode_quick
    ;;
  server)
    mode_server_only
    ;;
  analyze)
    mode_analyze
    ;;
  compare)
    mode_compare
    ;;
  help|--help|-h)
    show_usage
    ;;
  *)
    log_error "Unknown mode: $MODE"
    show_usage
    exit 1
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✨ Lighthouse audit complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
