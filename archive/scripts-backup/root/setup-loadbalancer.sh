#!/bin/bash

################################################################################
# INFÆMOUS FREIGHT - Load Balancer Setup Script
# Version: 1.0.0
# Purpose: Setup and configure NGINX load balancer for production deployment
################################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="${SCRIPT_DIR}/ssl"
CERTBOT_DIR="${SCRIPT_DIR}/certbot"
NGINX_CONF="${SCRIPT_DIR}/nginx.conf"
DOCKER_COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.loadbalancer.yml"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

################################################################################
# Validation Functions
################################################################################

check_requirements() {
    print_header "Checking Requirements"
    
    local missing_requirements=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_requirements+=("docker")
    else
        print_success "Docker installed: $(docker --version)"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_requirements+=("docker-compose")
    else
        print_success "Docker Compose installed: $(docker-compose --version)"
    fi
    
    # Check if files exist
    if [[ ! -f "$NGINX_CONF" ]]; then
        print_error "NGINX configuration not found: $NGINX_CONF"
        missing_requirements+=("nginx.conf")
    else
        print_success "NGINX configuration found"
    fi
    
    if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
        print_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        missing_requirements+=("docker-compose.loadbalancer.yml")
    else
        print_success "Docker Compose file found"
    fi
    
    if [[ ${#missing_requirements[@]} -gt 0 ]]; then
        print_error "Missing requirements: ${missing_requirements[*]}"
        exit 1
    fi
    
    echo ""
}

################################################################################
# Setup Functions
################################################################################

setup_directories() {
    print_header "Setting Up Directories"
    
    mkdir -p "$SSL_DIR"
    mkdir -p "$CERTBOT_DIR/www"
    mkdir -p "${SCRIPT_DIR}/nginx_logs"
    mkdir -p "${SCRIPT_DIR}/nginx_cache"
    
    print_success "Directories created"
    echo ""
}

setup_ssl_certificates() {
    print_header "SSL Certificate Setup"
    
    print_info "Choose SSL certificate option:"
    echo "1) Generate self-signed certificate (development/testing)"
    echo "2) Use Let's Encrypt (production)"
    echo "3) Use existing certificates"
    echo "4) Skip SSL setup"
    
    read -p "Enter option (1-4): " ssl_option
    
    case $ssl_option in
        1)
            generate_self_signed_cert
            ;;
        2)
            setup_letsencrypt
            ;;
        3)
            print_info "Place your certificates in: $SSL_DIR"
            print_info "Required files:"
            print_info "  - infamousfreight.com.crt (certificate)"
            print_info "  - infamousfreight.com.key (private key)"
            read -p "Press Enter when certificates are in place..."
            ;;
        4)
            print_warning "Skipping SSL setup - HTTPS will not work"
            ;;
        *)
            print_error "Invalid option"
            exit 1
            ;;
    esac
    
    echo ""
}

generate_self_signed_cert() {
    print_info "Generating self-signed certificate..."
    
    local domain=${SSL_DOMAIN:-"localhost"}
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/infamousfreight.com.key" \
        -out "$SSL_DIR/infamousfreight.com.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$domain"
    
    print_success "Self-signed certificate generated"
    print_warning "This is for development only - use Let's Encrypt in production"
}

setup_letsencrypt() {
    print_info "Setting up Let's Encrypt..."
    
    read -p "Enter your domain name (e.g., infamousfreight.com): " domain
    read -p "Enter your email address: " email
    
    # Start NGINX with HTTP only first
    print_info "Starting NGINX for Let's Encrypt challenge..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d nginx
    
    # Wait for NGINX to start
    sleep 5
    
    # Get certificate
    docker-compose -f "$DOCKER_COMPOSE_FILE" --profile ssl run --rm certbot \
        certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email "$email" \
        --agree-tos \
        --no-eff-email \
        -d "$domain" -d "www.$domain"
    
    # Copy certificates to SSL directory
    cp "/etc/letsencrypt/live/$domain/fullchain.pem" "$SSL_DIR/infamousfreight.com.crt"
    cp "/etc/letsencrypt/live/$domain/privkey.pem" "$SSL_DIR/infamousfreight.com.key"
    
    print_success "Let's Encrypt certificate obtained"
    print_info "Certificate auto-renewal is configured"
}

configure_backends() {
    print_header "Backend Configuration"
    
    print_info "The following backend instances will be configured:"
    echo "  - API Instance 1: api-1:4000"
    echo "  - API Instance 2: api-2:4000"
    echo "  - API Instance 3: api-3:4000 (backup, HA profile)"
    echo "  - Web Instance 1: web-1:3000"
    echo "  - Web Instance 2: web-2:3000"
    echo ""
    
    print_info "To modify backend servers, edit: $NGINX_CONF"
    print_info "Look for 'upstream api_backend' and 'upstream web_backend' sections"
    echo ""
    
    read -p "Continue with current configuration? (y/n): " continue_config
    if [[ "$continue_config" != "y" ]]; then
        print_info "Edit $NGINX_CONF and run this script again"
        exit 0
    fi
}

test_nginx_config() {
    print_header "Testing NGINX Configuration"
    
    # Test config with Docker
    docker run --rm \
        -v "$NGINX_CONF:/etc/nginx/nginx.conf:ro" \
        nginx:1.25-alpine \
        nginx -t
    
    if [[ $? -eq 0 ]]; then
        print_success "NGINX configuration is valid"
    else
        print_error "NGINX configuration has errors"
        exit 1
    fi
    
    echo ""
}

################################################################################
# Deployment Functions
################################################################################

deploy_load_balancer() {
    print_header "Deploying Load Balancer"
    
    read -p "Deploy with high availability (3 API instances)? (y/n): " ha_mode
    
    local compose_cmd="docker-compose -f $DOCKER_COMPOSE_FILE"
    
    if [[ "$ha_mode" == "y" ]]; then
        print_info "Deploying with high availability profile..."
        compose_cmd="$compose_cmd --profile high-availability"
    fi
    
    # Pull latest images
    print_info "Pulling latest images..."
    $compose_cmd pull
    
    # Build services
    print_info "Building services..."
    $compose_cmd build
    
    # Start services
    print_info "Starting services..."
    $compose_cmd up -d
    
    # Wait for services to be healthy
    print_info "Waiting for services to become healthy..."
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        local healthy=$($compose_cmd ps | grep -c "healthy" || echo "0")
        local total=$($compose_cmd ps | grep -c "Up" || echo "0")
        
        if [[ $healthy -gt 0 ]] && [[ $healthy -eq $total ]]; then
            print_success "All services are healthy"
            break
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    echo ""
    
    if [[ $attempt -eq $max_attempts ]]; then
        print_warning "Some services may not be fully healthy yet"
        print_info "Check status with: docker-compose -f $DOCKER_COMPOSE_FILE ps"
    fi
    
    echo ""
}

run_health_checks() {
    print_header "Running Health Checks"
    
    # Check NGINX status endpoint
    print_info "Checking NGINX status..."
    if curl -sf http://localhost:8080/health > /dev/null; then
        print_success "NGINX is healthy"
    else
        print_error "NGINX health check failed"
    fi
    
    # Check API health through load balancer
    print_info "Checking API health..."
    if curl -sf http://localhost/api/health > /dev/null; then
        print_success "API is healthy (through load balancer)"
    else
        print_error "API health check failed"
    fi
    
    # Show load balancer stats
    print_info "Load balancer statistics:"
    curl -s http://localhost:8080/nginx_status
    
    echo ""
}

show_deployment_info() {
    print_header "Deployment Information"
    
    echo ""
    print_info "🎉 Load balancer deployment complete!"
    echo ""
    print_info "Access URLs:"
    echo "  - HTTP:  http://localhost"
    echo "  - HTTPS: https://localhost"
    echo "  - API:   http://localhost/api/"
    echo "  - Stats: http://localhost:8080/nginx_status"
    echo ""
    print_info "Monitoring:"
    echo "  - View logs:   docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo "  - View status: docker-compose -f $DOCKER_COMPOSE_FILE ps"
    echo "  - View stats:  curl http://localhost:8080/nginx_status"
    echo ""
    print_info "Management:"
    echo "  - Stop:       docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo "  - Restart:    docker-compose -f $DOCKER_COMPOSE_FILE restart nginx"
    echo "  - Scale API:  docker-compose -f $DOCKER_COMPOSE_FILE up -d --scale api-1=3"
    echo ""
    
    # Show running containers
    print_info "Running containers:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    echo ""
}

################################################################################
# Main Script
################################################################################

show_menu() {
    print_header "INFÆMOUS FREIGHT Load Balancer Setup"
    
    echo ""
    echo "1) Complete setup (run all steps)"
    echo "2) Setup directories only"
    echo "3) Setup SSL certificates only"
    echo "4) Test NGINX configuration"
    echo "5) Deploy load balancer"
    echo "6) Run health checks"
    echo "7) Show deployment info"
    echo "8) Exit"
    echo ""
    
    read -p "Enter option (1-8): " option
    
    case $option in
        1)
            check_requirements
            setup_directories
            setup_ssl_certificates
            configure_backends
            test_nginx_config
            deploy_load_balancer
            run_health_checks
            show_deployment_info
            ;;
        2)
            setup_directories
            ;;
        3)
            setup_ssl_certificates
            ;;
        4)
            test_nginx_config
            ;;
        5)
            deploy_load_balancer
            ;;
        6)
            run_health_checks
            ;;
        7)
            show_deployment_info
            ;;
        8)
            print_info "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid option"
            exit 1
            ;;
    esac
}

# Main execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    cd "$SCRIPT_DIR"
    
    # If arguments provided, run non-interactively
    if [[ $# -gt 0 ]]; then
        case $1 in
            setup)
                check_requirements
                setup_directories
                setup_ssl_certificates
                configure_backends
                test_nginx_config
                deploy_load_balancer
                run_health_checks
                show_deployment_info
                ;;
            test)
                test_nginx_config
                ;;
            deploy)
                deploy_load_balancer
                ;;
            health)
                run_health_checks
                ;;
            info)
                show_deployment_info
                ;;
            *)
                echo "Usage: $0 {setup|test|deploy|health|info}"
                exit 1
                ;;
        esac
    else
        # Interactive mode
        show_menu
    fi
fi
