#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Setup Docker secrets for production deployment

set -e

SECRETS_DIR="./secrets"
REQUIRED_SECRETS=(
  "jwt_secret"
  "jwt_refresh_secret"
  "db_password"
  "redis_password"
)

echo "🔐 Docker Secrets Setup Script"
echo "================================"

# Create secrets directory
mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

# Check if secrets already exist
if [ -f "$SECRETS_DIR/jwt_secret.txt" ]; then
  echo "⚠️  Secrets already exist. Skipping creation."
  echo "To regenerate, delete $SECRETS_DIR and run again."
  exit 0
fi

echo ""
echo "📝 Creating secrets..."

# Generate JWT secret (256-bit base64)
echo "$(openssl rand -base64 32)" > "$SECRETS_DIR/jwt_secret.txt"
echo "✓ JWT secret created"

# Generate JWT refresh secret
echo "$(openssl rand -base64 32)" > "$SECRETS_DIR/jwt_refresh_secret.txt"
echo "✓ JWT refresh secret created"

# Generate database password (strong)
echo "$(openssl rand -base64 32)" > "$SECRETS_DIR/db_password.txt"
echo "✓ Database password created"

# Generate Redis password
echo "$(openssl rand -base64 32)" > "$SECRETS_DIR/redis_password.txt"
echo "✓ Redis password created"

# Set restrictive permissions
chmod 600 "$SECRETS_DIR"/*.txt
echo ""
echo "✓ All secrets created with restricted permissions (600)"
echo ""
echo "📍 Next steps:"
echo "1. Add secrets to .env:"
echo "   JWT_SECRET=\$(cat $SECRETS_DIR/jwt_secret.txt)"
echo "   JWT_REFRESH_SECRET=\$(cat $SECRETS_DIR/jwt_refresh_secret.txt)"
echo "   POSTGRES_PASSWORD=\$(cat $SECRETS_DIR/db_password.txt)"
echo "   REDIS_PASSWORD=\$(cat $SECRETS_DIR/redis_password.txt)"
echo ""
echo "2. Update docker-compose.prod.yml to use secrets:"
echo "   secrets:"
echo "     - jwt_secret"
echo "     - db_password"
echo ""
echo "3. For Docker Swarm, create secrets:"
echo "   docker secret create jwt_secret $SECRETS_DIR/jwt_secret.txt"
echo ""
echo "⚠️  IMPORTANT: Add secrets/ to .gitignore"
grep -q "^secrets/$" .gitignore || echo "secrets/" >> .gitignore
echo "✓ Added secrets/ to .gitignore"
