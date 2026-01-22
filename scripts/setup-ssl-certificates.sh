#!/bin/bash

# SSL Certificate Setup Script for Infamous Freight Enterprises
# Supports both self-signed (dev) and Let's Encrypt (production)

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSL_DIR="nginx/ssl"
CERT_DOMAIN="${CERT_DOMAIN:-infamous-freight.example.com}"
CERT_VALIDITY_DAYS="${CERT_VALIDITY_DAYS:-365}"
ENVIRONMENT="${ENVIRONMENT:-development}"

# Functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

check_dependencies() {
    print_header "Checking Dependencies"
    
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is not installed"
        echo "Install with: apt-get install openssl (Ubuntu/Debian)"
        exit 1
    fi
    
    print_status "OpenSSL found: $(openssl version)"
    
    if command -v certbot &> /dev/null; then
        print_status "Certbot found (for Let's Encrypt)"
    else
        print_warning "Certbot not found (required for Let's Encrypt)"
    fi
}

create_ssl_directory() {
    print_header "Creating SSL Directory"
    
    if [ ! -d "$SSL_DIR" ]; then
        mkdir -p "$SSL_DIR"
        print_status "Created directory: $SSL_DIR"
    else
        print_warning "Directory already exists: $SSL_DIR"
    fi
    
    chmod 700 "$SSL_DIR"
    print_status "Set permissions to 700 (secure)"
}

generate_self_signed_certificate() {
    print_header "Generating Self-Signed Certificate"
    
    local cert_file="$SSL_DIR/infamous-freight.crt"
    local key_file="$SSL_DIR/infamous-freight.key"
    
    if [ -f "$cert_file" ] && [ -f "$key_file" ]; then
        print_warning "Certificate and key already exist"
        read -p "Overwrite existing certificates? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Skipping certificate generation"
            return
        fi
    fi
    
    print_status "Generating private key (RSA 2048-bit)..."
    openssl genrsa -out "$key_file" 2048 2>/dev/null
    print_status "Generated: $key_file"
    
    print_status "Generating certificate signing request..."
    openssl req -new -key "$key_file" \
        -out "$SSL_DIR/infamous-freight.csr" \
        -subj "/C=US/ST=California/L=San Francisco/O=Infamous Freight/CN=$CERT_DOMAIN" \
        2>/dev/null
    print_status "Generated CSR"
    
    print_status "Signing certificate (valid for $CERT_VALIDITY_DAYS days)..."
    openssl x509 -req -days "$CERT_VALIDITY_DAYS" \
        -in "$SSL_DIR/infamous-freight.csr" \
        -signkey "$key_file" \
        -out "$cert_file" \
        2>/dev/null
    print_status "Generated: $cert_file"
    
    # Cleanup CSR
    rm -f "$SSL_DIR/infamous-freight.csr"
    
    # Set secure permissions
    chmod 600 "$key_file"
    chmod 644 "$cert_file"
    
    print_status "Self-signed certificate generated successfully!"
    print_warning "NOTE: Self-signed certificates will trigger browser warnings"
}

generate_letsencrypt_certificate() {
    print_header "Setting Up Let's Encrypt Certificate"
    
    if ! command -v certbot &> /dev/null; then
        print_error "Certbot is required for Let's Encrypt"
        echo "Install with: apt-get install certbot (Ubuntu/Debian)"
        echo "           : brew install certbot (macOS)"
        exit 1
    fi
    
    local email="${CERT_EMAIL:-admin@infamous-freight.example.com}"
    
    print_warning "Ensure your domain ($CERT_DOMAIN) is publicly accessible"
    print_warning "Ensure port 80 (HTTP) is open for Let's Encrypt validation"
    
    read -p "Continue with Let's Encrypt setup? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Skipping Let's Encrypt setup"
        return
    fi
    
    print_status "Running Certbot for domain: $CERT_DOMAIN"
    
    certbot certonly --standalone \
        -d "$CERT_DOMAIN" \
        -d "www.$CERT_DOMAIN" \
        --email "$email" \
        --agree-tos \
        --no-eff-email \
        --rsa-key-size 2048 \
        --preferred-challenges http \
        --force-renewal
    
    if [ $? -eq 0 ]; then
        print_status "Let's Encrypt certificate obtained successfully!"
        
        # Create links to standard location
        local le_dir="/etc/letsencrypt/live/$CERT_DOMAIN"
        if [ -d "$le_dir" ]; then
            ln -sf "$le_dir/fullchain.pem" "$SSL_DIR/infamous-freight.crt"
            ln -sf "$le_dir/privkey.pem" "$SSL_DIR/infamous-freight.key"
            print_status "Created symlinks to Let's Encrypt certificates"
            
            # Setup auto-renewal
            print_status "Setting up automatic renewal..."
            (crontab -l 2>/dev/null || true; echo "0 3 * * * certbot renew --quiet") | crontab -
            print_status "Auto-renewal scheduled daily at 3 AM"
        fi
    else
        print_error "Let's Encrypt certificate generation failed"
        exit 1
    fi
}

verify_certificates() {
    print_header "Verifying Certificates"
    
    local cert_file="$SSL_DIR/infamous-freight.crt"
    local key_file="$SSL_DIR/infamous-freight.key"
    
    if [ ! -f "$cert_file" ]; then
        print_error "Certificate not found: $cert_file"
        return 1
    fi
    
    if [ ! -f "$key_file" ]; then
        print_error "Private key not found: $key_file"
        return 1
    fi
    
    print_status "Certificate Information:"
    openssl x509 -in "$cert_file" -text -noout | grep -E "Subject|Issuer|Not Before|Not After"
    
    print_status "Verifying certificate and key match..."
    local cert_modulus=$(openssl x509 -in "$cert_file" -noout -modulus | openssl md5 | cut -d' ' -f2)
    local key_modulus=$(openssl rsa -in "$key_file" -noout -modulus 2>/dev/null | openssl md5 | cut -d' ' -f2)
    
    if [ "$cert_modulus" = "$key_modulus" ]; then
        print_status "✓ Certificate and key match!"
    else
        print_error "✗ Certificate and key DO NOT match!"
        return 1
    fi
    
    print_status "Checking certificate validity..."
    if openssl x509 -in "$cert_file" -noout -checkend 0 > /dev/null 2>&1; then
        local expiry=$(openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2)
        print_status "Certificate is valid. Expires: $expiry"
    else
        print_error "Certificate has expired!"
        return 1
    fi
}

test_ssl_configuration() {
    print_header "Testing SSL Configuration"
    
    local cert_file="$SSL_DIR/infamous-freight.crt"
    local key_file="$SSL_DIR/infamous-freight.key"
    
    if [ ! -f "$cert_file" ] || [ ! -f "$key_file" ]; then
        print_warning "Certificates not found, skipping SSL test"
        return
    fi
    
    print_status "SSL configuration is ready!"
    print_status "Certificate: $cert_file"
    print_status "Private key: $key_file"
    
    echo -e "\n${BLUE}Next steps:${NC}"
    echo "1. Update nginx/nginx.conf to use these certificates"
    echo "2. Restart Nginx: docker-compose restart nginx"
    echo "3. Test HTTPS: curl --insecure https://localhost"
    echo "4. Check SSL Labs: https://www.ssllabs.com/ssltest/"
}

create_nginx_ssl_config() {
    print_header "Creating Nginx SSL Configuration"
    
    local nginx_dir="nginx"
    local nginx_conf="$nginx_dir/nginx.conf"
    
    if [ ! -d "$nginx_dir" ]; then
        mkdir -p "$nginx_dir"
        print_status "Created directory: $nginx_dir"
    fi
    
    # Check if nginx.conf already has SSL
    if grep -q "ssl_certificate" "$nginx_conf" 2>/dev/null; then
        print_status "Nginx SSL configuration already present"
        return
    fi
    
    # Create/update nginx.conf with SSL
    cat > "$nginx_conf" << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # GZIP compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # HTTP redirect
    server {
        listen 80;
        server_name _;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name _;

        ssl_certificate /etc/nginx/ssl/infamous-freight.crt;
        ssl_certificate_key /etc/nginx/ssl/infamous-freight.key;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API proxy
        location /api/ {
            proxy_pass http://api:4000/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Web proxy
        location / {
            proxy_pass http://web:3000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF
    
    print_status "Created: $nginx_conf"
}

show_summary() {
    print_header "SSL Setup Summary"
    
    echo -e "${BLUE}Generated Files:${NC}"
    ls -lh "$SSL_DIR"/*.{crt,key} 2>/dev/null || echo "  (No certificates found)"
    
    echo -e "\n${BLUE}Configuration:${NC}"
    echo "  Environment: $ENVIRONMENT"
    echo "  Domain: $CERT_DOMAIN"
    echo "  Validity: $CERT_VALIDITY_DAYS days"
    echo "  SSL Directory: $SSL_DIR"
    
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo "  1. Verify certificates: bash scripts/verify-ssl.sh"
    echo "  2. Update Nginx config: $nginx_conf"
    echo "  3. Restart Nginx: docker-compose restart nginx"
    echo "  4. Test HTTPS: curl --insecure https://localhost"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "\n${YELLOW}Production Security Checklist:${NC}"
        echo "  ☐ Use Let's Encrypt certificates (not self-signed)"
        echo "  ☐ Enable HSTS preload"
        echo "  ☐ Configure OCSP stapling"
        echo "  ☐ Test with SSL Labs (A+ rating target)"
        echo "  ☐ Monitor certificate expiration"
        echo "  ☐ Set up auto-renewal cron job"
    fi
}

# Main execution
main() {
    print_header "SSL Certificate Setup - Infamous Freight Enterprises"
    
    echo "Environment: $ENVIRONMENT"
    echo "Domain: $CERT_DOMAIN"
    echo ""
    
    check_dependencies
    create_ssl_directory
    
    if [ "$ENVIRONMENT" = "production" ]; then
        print_warning "Production environment detected"
        read -p "Use Let's Encrypt for production? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            generate_letsencrypt_certificate
        else
            print_error "Self-signed certificates NOT recommended for production"
            exit 1
        fi
    else
        generate_self_signed_certificate
    fi
    
    verify_certificates
    create_nginx_ssl_config
    test_ssl_configuration
    show_summary
    
    print_status "SSL setup completed!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--domain)
            CERT_DOMAIN="$2"
            shift 2
            ;;
        -l|--letsencrypt)
            ENVIRONMENT="production"
            shift
            ;;
        -s|--self-signed)
            ENVIRONMENT="development"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -e, --environment ENV   Environment: development|production (default: development)"
            echo "  -d, --domain DOMAIN    Certificate domain (default: infamous-freight.example.com)"
            echo "  -l, --letsencrypt     Use Let's Encrypt (production)"
            echo "  -s, --self-signed     Use self-signed (development)"
            echo "  -h, --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --environment development"
            echo "  $0 --environment production --domain my-freight.com --letsencrypt"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

main
