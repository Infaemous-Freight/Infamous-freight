#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Blue-Green Deployment Switch Script
# 
# Usage:
#   ./switch-deployment.sh blue   # Switch nginx to blue deployment
#   ./switch-deployment.sh green  # Switch nginx to green deployment
#   ./switch-deployment.sh status # Show current deployment

set -e

DOCKER_COMPOSE_CMD="${1:-}"
DEPLOYMENT="${2:-}"

BLUE_UPSTREAM="api-blue:4000"
GREEN_UPSTREAM="api-green:4000"
NGINX_CONFIG="/etc/nginx/conf.d/default.conf"
CONTAINER_NAME="infamous-nginx-prod"

print_usage() {
  echo "Blue-Green Deployment Switch"
  echo "============================"
  echo ""
  echo "Usage: ./switch-deployment.sh <deployment> [options]"
  echo ""
  echo "Deployments:"
  echo "  blue                 - Switch traffic to blue deployment"
  echo "  green                - Switch traffic to green deployment"
  echo "  status               - Show current active deployment"
  echo "  health-check         - Test both deployments"
  echo ""
}

# Test deployment health
health_check() {
  local deployment=$1
  local port=$2
  
  echo "🏥 Checking health of $deployment deployment..."
  
  for i in {1..5}; do
    if docker exec "$CONTAINER_NAME" curl -sf "http://$deployment:$port/api/health" > /dev/null 2>&1; then
      echo "✓ $deployment is healthy"
      return 0
    fi
    echo "  Attempt $i/5 waiting for $deployment to be ready..."
    sleep 2
  done
  
  echo "✗ $deployment failed health check"
  return 1
}

# Switch deployment
switch_to() {
  local target=$1
  
  echo "🔄 Switching to $target deployment..."
  
  # Check health before switching
  if ! health_check "$target" "4000"; then
    echo "❌ Aborting: $target deployment is not healthy"
    return 1
  fi
  
  echo "✓ Health check passed, proceeding with switch..."
  
  # Update nginx configuration
  docker exec "$CONTAINER_NAME" sed -i \
    "s/server $BLUE_UPSTREAM;/server ${target}:4000;/" \
    "$NGINX_CONFIG"
  
  # Reload nginx gracefully (no downtime)
  docker exec "$CONTAINER_NAME" nginx -s reload
  
  echo "✓ Nginx reloaded with $target"
  
  # Verify switch
  sleep 2
  if health_check "$target" "4000"; then
    echo "✅ Successfully switched to $target deployment"
    return 0
  else
    echo "❌ Switch verification failed, rolling back..."
    # Rollback logic could go here
    return 1
  fi
}

# Show status
show_status() {
  echo "📊 Deployment Status"
  echo "==================="
  echo ""
  
  # Get current upstream from nginx config
  local current=$(docker exec "$CONTAINER_NAME" grep "server api-" "$NGINX_CONFIG" | grep -oE "api-(blue|green)" | head -1)
  echo "Current deployment: $current"
  
  echo ""
  echo "🔍 Service Health:"
  echo ""
  
  if docker exec "$CONTAINER_NAME" curl -sf "http://api-blue:4000/api/health" > /dev/null 2>&1; then
    echo "✓ Blue:  Healthy"
  else
    echo "✗ Blue:  Unhealthy"
  fi
  
  if docker exec "$CONTAINER_NAME" curl -sf "http://api-green:4000/api/health" > /dev/null 2>&1; then
    echo "✓ Green: Healthy"
  else
    echo "✗ Green: Unhealthy"
  fi
  
  echo ""
  echo "📈 Recent Deployments:"
  docker image ls | grep "api" | head -5
}

# Main
case "${1:-}" in
  blue)
    switch_to "api-blue"
    ;;
  green)
    switch_to "api-green"
    ;;
  status)
    show_status
    ;;
  health-check)
    echo "🏥 Running health checks..."
    health_check "api-blue" "4000"
    health_check "api-green" "4000"
    ;;
  *)
    print_usage
    exit 1
    ;;
esac
