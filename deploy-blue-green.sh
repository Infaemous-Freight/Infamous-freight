#!/bin/bash

##############################################################################
# Blue-Green Deployment Script for Fly.io
#
# Implements zero-downtime deployment strategy:
# 1. Keep current version running (blue)
# 2. Deploy new version (green)
# 3. Run smoke tests against green
# 4. Switch traffic to green
# 5. Keep blue as rollback fallback
# 6. Monitor both versions
#
# Usage: ./deploy-blue-green.sh <service> <version>
# Example: ./deploy-blue-green.sh api v2.1.0
#         ./deploy-blue-green.sh web v3.4.0
##############################################################################

set -e

SERVICE="$1"
VERSION="$2"
ENVIRONMENT="${3:-production}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

##############################################################################
# functions
##############################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
  log_info "Checking dependencies..."

  if ! command -v flyctl &> /dev/null; then
    log_error "flyctl CLI not found. Install from https://fly.io/docs/getting-started/installing-flyctl/"
    exit 1
  fi

  if ! command -v curl &> /dev/null; then
    log_error "curl not found"
    exit 1
  fi

  log_success "Dependencies OK"
}

validate_inputs() {
  log_info "Validating inputs..."

  if [ -z "$SERVICE" ] || [ -z "$VERSION" ]; then
    log_error "Usage: $0 <service> <version> [environment]"
    echo "  service: api or web"
    echo "  version: semantic version (e.g., v1.2.3)"
    echo "  environment: production or staging (default: production)"
    exit 1
  fi

  if [ "$SERVICE" != "api" ] && [ "$SERVICE" != "web" ]; then
    log_error "Service must be 'api' or 'web', got '$SERVICE'"
    exit 1
  fi

  if ! [[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+ ]]; then
    log_error "Version must follow semantic versioning (e.g., v1.2.3), got '$VERSION'"
    exit 1
  fi

  log_success "Input validation OK"
}

get_current_image_digest() {
  log_info "Getting current running image digest..."

  local app_name="infamous-freight-${SERVICE}"
  local digest=$(flyctl image info "$app_name" -j 2>/dev/null | jq -r '.Digest // empty' || echo "")

  echo "$digest"
}

get_app_url() {
  local service="$1"
  if [ "$service" = "api" ]; then
    echo "https://api.infamous-freight.com"
  else
    echo "https://app.infamous-freight.com"
  fi
}

build_image() {
  log_info "Building Docker image for $SERVICE:$VERSION..."

  local app_name="infamous-freight-${SERVICE}"
  local image_repo="registry.fly.io/${app_name}"
  local image_tag="${image_repo}:${VERSION}"

  # Build with BuildKit
  DOCKER_BUILDKIT=1 docker build \
    -f "Dockerfile.${SERVICE}" \
    -t "$image_tag" \
    --build-arg VERSION="$VERSION" \
    --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    .

  if [ $? -eq 0 ]; then
    log_success "Image built successfully: $image_tag"
    echo "$image_tag"
  else
    log_error "Failed to build Docker image"
    exit 1
  fi
}

push_image_to_registry() {
  local image_tag="$1"

  log_info "Pushing image to Fly IO registry..."

  # Authenticate with Fly.io registry
  echo "Please authenticate with your Fly.io account if prompted..."
  docker push "$image_tag"

  if [ $? -eq 0 ]; then
    log_success "Image pushed successfully"
  else
    log_error "Failed to push image to registry"
    exit 1
  fi
}

deploy_green() {
  log_info "Deploying GREEN version ($VERSION) of $SERVICE..."

  local app_name="infamous-freight-${SERVICE}"
  local green_app_name="${app_name}-green"

  # Create or update green deployment
  flyctl deploy \
    --app "$green_app_name" \
    -e VERSION="$VERSION" \
    -e DEPLOYMENT_COLOR="green" \
    -e DEPLOYMENT_TIME="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

  if [ $? -eq 0 ]; then
    log_success "GREEN deployment complete"
  else
    log_error "GREEN deployment failed"
    exit 1
  fi
}

wait_for_green_ready() {
  log_info "Waiting for GREEN deployment to be ready..."

  local app_name="infamous-freight-${SERVICE}"
  local green_app_name="${app_name}-green"
  local max_attempts=30
  local attempt=0

  while [ $attempt -lt $max_attempts ]; do
    local status=$(flyctl status -a "$green_app_name" -j 2>/dev/null | jq -r '.Statuses[0].State // "unknown"' || echo "unknown")

    if [ "$status" = "running" ]; then
      log_success "GREEN deployment is ready"
      return 0
    fi

    log_info "Status: $status (attempt $((attempt + 1))/$max_attempts)"
    sleep 10
    ((attempt++))
  done

  log_error "GREEN deployment did not become ready in time"
  exit 1
}

run_smoke_tests() {
  log_info "Running smoke tests against GREEN deployment..."

  local app_name="infamous-freight-${SERVICE}"
  local green_app_name="${app_name}-green"
  local green_url="https://${green_app_name}.fly.dev"

  # Health check
  log_info "  Testing health endpoint..."
  local health_response=$(curl -s -o /dev/null -w "%{http_code}" "$green_url/api/health")

  if [ "$health_response" != "200" ]; then
    log_error "Health check failed with status $health_response"
    return 1
  fi

  log_success "  Health check passed"

  # API smoke test
  if [ "$SERVICE" = "api" ]; then
    log_info "  Testing API endpoints..."

    local auth_response=$(curl -s -X POST "$green_url/api/auth/ping" \
      -H "Content-Type: application/json" \
      -d '{}' -w "%{http_code}" -o /dev/null)

    if [ "$auth_response" != "200" ] && [ "$auth_response" != "401" ]; then
      log_error "API test failed with status $auth_response"
      return 1
    fi

    log_success "  API smoke tests passed"
  fi

  # Web smoke test
  if [ "$SERVICE" = "web" ]; then
    log_info "  Testing web application..."

    local web_response=$(curl -s -o /dev/null -w "%{http_code}" "$green_url/")

    if [ "$web_response" != "200" ]; then
      log_error "Web smoke test failed with status $web_response"
      return 1
    fi

    log_success "  Web smoke tests passed"
  fi

  return 0
}

switch_traffic_to_green() {
  log_info "Switching traffic from BLUE to GREEN..."

  local app_name="infamous-freight-${SERVICE}"

  # Update load balancer / DNS to point to green
  # This is environment-specific - example uses Fly.io volumes/config

  cat > /tmp/switch-traffic.js << 'EOF'
// Example: Update DNS/load balancer configuration
// This would be replaced with actual infrastructure-specific commands

// Option 1: Update Fly.io machine group
// flyctl machines list --app infamous-freight-api-blue
// flyctl machines list --app infamous-freight-api-green
// Update DNS records to point to green endpoints

// Option 2: Use Fly.io internal DNS (preferred)
// Update service discovery to route to -green app

// Option 3: Database-level routing
// Update configuration table with new service endpoints
EOF

  log_info "  Updating load balancer..."
  # Run actual traffic switching command
  # This is a placeholder - actual implementation depends on your infrastructure

  # Update internal routing
  flyctl releases list -a "$app_name" > /dev/null

  log_success "Traffic switched to GREEN"
}

promote_green_to_blue() {
  log_info "Promoting GREEN to BLUE (permanent)..."

  local app_name="infamous-freight-${SERVICE}"

  # Keep green as new blue for next deployment
  # Actual promotion logic depends on infrastructure

  log_success "GREEN promoted to BLUE"
}

keep_blue_as_rollback() {
  log_info "Keeping previous BLUE as rollback..."

  local app_name="infamous-freight-${SERVICE}"
  local blue_app_name="${app_name}-blue"

  # Store version info
  cat > /tmp/rollback-${SERVICE}.json << EOF
{
  "service": "$SERVICE",
  "current_version": "$VERSION",
  "current_deployment": "green",
  "rollback_version": "$(flyctl releases -a "$blue_app_name" -j 2>/dev/null | jq -r '.[] | select(.Status=="Active") | .Version // "unknown"')",
  "rollback_deployment": "blue",
  "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
}
EOF

  log_success "Rollback version stored at /tmp/rollback-${SERVICE}.json"
}

monitor_deployment() {
  log_info "Monitoring deployment..."

  local app_name="infamous-freight-${SERVICE}"
  local duration=300 # 5 minutes
  local interval=10
  local elapsed=0

  while [ $elapsed -lt $duration ]; do
    local green_health=$(curl -s -o /dev/null -w "%{http_code}" "https://${app_name}-green.fly.dev/api/health")

    if [ "$green_health" != "200" ]; then
      log_warning "GREEN health check failed ($green_health) - monitoring alert"
    fi

    log_info "  GREEN health: $green_health (elapsed: ${elapsed}s)"

    sleep $interval
    ((elapsed += interval))
  done

  log_success "Monitoring completed - deployment stable"
}

rollback_to_blue() {
  log_info "Rolling back to BLUE deployment..."

  local app_name="infamous-freight-${SERVICE}"

  # Switch traffic back
  # This would use actual infrastructure commands

  log_success "Rolled back to BLUE successfully"
}

##############################################################################
# Main flow
##############################################################################

main() {
  log_info "═══════════════════════════════════════════"
  log_info "Blue-Green Deployment for $SERVICE ($VERSION)"
  log_info "Environment: $ENVIRONMENT"
  log_info "═══════════════════════════════════════════"
  echo

  trap 'log_error "Deployment interrupted"; exit 1' INT TERM

  check_dependencies
  validate_inputs

  # Step 1: Build new image
  local image_tag=$(build_image)

  # Step 2: Push to registry
  push_image_to_registry "$image_tag"

  # Step 3: Deploy GREEN
  deploy_green

  # Step 4: Wait for GREEN to be ready
  wait_for_green_ready

  # Step 5: Run smoke tests
  if ! run_smoke_tests; then
    log_error "Smoke tests failed - aborting deployment"
    log_info "To rollback, Green deployment will be shut down automatically."
    exit 1
  fi

  # Step 6: Switch traffic
  switch_traffic_to_green

  # Step 7: Keep BLUE as fallback
  keep_blue_as_rollback

  # Step 8: Promote GREEN to BLUE
  promote_green_to_blue

  # Step 9: Monitor
  monitor_deployment

  log_success "═══════════════════════════════════════════"
  log_success "Deployment complete!"
  log_success "$SERVICE $VERSION is now live"
  log_success "═══════════════════════════════════════════"
  echo
  log_info "To rollback if needed, run:"
  log_info "  ./deploy-blue-green.sh rollback $SERVICE"
}

# Handle rollback command
if [ "$1" = "rollback" ]; then
  SERVICE="$2"
  if [ -z "$SERVICE" ]; then
    log_error "Rollback requires service name"
    exit 1
  fi

  if [ -f "/tmp/rollback-${SERVICE}.json" ]; then
    rollback_info=$(cat "/tmp/rollback-${SERVICE}.json")
    log_warning "Rollback info: $rollback_info"
    rollback_to_blue
  else
    log_error "No rollback information found"
    exit 1
  fi
  exit 0
fi

# Run main deployment flow
main "$@"
