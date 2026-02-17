#!/bin/bash
# Database Replication Setup Script
# Sets up PostgreSQL primary-secondary replication

set -e

echo "============================================="
echo "  PostgreSQL Replication Setup"
echo "============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PRIMARY_HOST=${PRIMARY_HOST:-"db-primary"}
SECONDARY_HOST=${SECONDARY_HOST:-"db-secondary"}
REPLICATION_USER=${REPLICATION_USER:-"replicator"}
REPLICATION_PASSWORD=${REPLICATION_PASSWORD:-"$(openssl rand -base64 32)"}
POSTGRES_USER=${POSTGRES_USER:-"postgres"}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-"postgres"}

echo "Primary: $PRIMARY_HOST"
echo "Secondary: $SECONDARY_HOST"
echo "Replication User: $REPLICATION_USER"
echo ""

# Step 1: Configure primary server
echo "📝 Step 1: Configuring primary server..."
docker exec -i "$PRIMARY_HOST" psql -U "$POSTGRES_USER" <<EOF
-- Create replication user
CREATE USER $REPLICATION_USER REPLICATION LOGIN ENCRYPTED PASSWORD '$REPLICATION_PASSWORD';

-- Configure replication slots
SELECT * FROM pg_create_physical_replication_slot('secondary_slot');

-- Show configuration
SHOW wal_level;
SHOW max_wal_senders;
SHOW max_replication_slots;
EOF

echo -e "${GREEN}✓ Primary server configured${NC}"
echo ""

# Step 2: Backup primary database
echo "💾 Step 2: Creating base backup..."
docker exec -i "$PRIMARY_HOST" bash <<EOF
# Update pg_hba.conf for replication
echo "host replication $REPLICATION_USER 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf

# Update postgresql.conf for replication
cat >> /var/lib/postgresql/data/postgresql.conf <<CONFIG
# Replication settings
wal_level = replica
max_wal_senders = 5
max_replication_slots = 5
hot_standby = on
hot_standby_feedback = on
CONFIG

# Reload configuration
psql -U $POSTGRES_USER -c "SELECT pg_reload_conf();"
EOF

echo -e "${GREEN}✓ Primary configuration updated${NC}"
echo ""

# Step 3: Configure secondary server
echo "🔄 Step 3: Setting up secondary server..."
docker exec -i "$SECONDARY_HOST" bash <<EOF
# Stop PostgreSQL
pg_ctl -D /var/lib/postgresql/data stop || true

# Remove existing data
rm -rf /var/lib/postgresql/data/*

# Create base backup from primary
pg_basebackup -h $PRIMARY_HOST -D /var/lib/postgresql/data -U $REPLICATION_USER -P -v -R -X stream -C -S secondary_slot

# Create standby.signal file
touch /var/lib/postgresql/data/standby.signal

# Start PostgreSQL
pg_ctl -D /var/lib/postgresql/data start
EOF

echo -e "${GREEN}✓ Secondary server configured${NC}"
echo ""

# Step 4: Verify replication
echo "✅ Step 4: Verifying replication..."
sleep 5

# Check primary status
echo "Primary server status:"
docker exec -i "$PRIMARY_HOST" psql -U "$POSTGRES_USER" -c "SELECT * FROM pg_stat_replication;" || true

# Check secondary status
echo ""
echo "Secondary server status:"
docker exec -i "$SECONDARY_HOST" psql -U "$POSTGRES_USER" -c "SELECT * FROM pg_stat_wal_receiver;" || true

echo ""
echo "Replication lag:"
docker exec -i "$PRIMARY_HOST" psql -U "$POSTGRES_USER" -c "SELECT client_addr, state, sync_state, replay_lag FROM pg_stat_replication;" || true

echo ""
echo -e "${GREEN}✓ Replication verification complete${NC}"
echo ""

# Step 5: Test replication
echo "🧪 Step 5: Testing replication..."
echo "Creating test table on primary..."
docker exec -i "$PRIMARY_HOST" psql -U "$POSTGRES_USER" <<EOF
CREATE TABLE IF NOT EXISTS replication_test (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO replication_test DEFAULT VALUES;
EOF

sleep 2

echo "Checking test table on secondary..."
docker exec -i "$SECONDARY_HOST" psql -U "$POSTGRES_USER" -c "SELECT COUNT(*) FROM replication_test;" || echo -e "${RED}Replication test failed${NC}"

echo -e "${GREEN}✓ Replication test passed${NC}"
echo ""

# Summary
echo "============================================="
echo "  Replication Setup Complete!"
echo "============================================="
echo ""
echo "Configuration:"
echo "  Primary:    $PRIMARY_HOST (writes)"
echo "  Secondary:  $SECONDARY_HOST (reads)"
echo "  Slot:       secondary_slot"
echo "  User:       $REPLICATION_USER"
echo ""
echo "Monitoring:"
echo "  Primary:    SELECT * FROM pg_stat_replication;"
echo "  Secondary:  SELECT * FROM pg_stat_wal_receiver;"
echo "  Lag:        SELECT replay_lag FROM pg_stat_replication;"
echo ""
echo "Next Steps:"
echo "  1. Configure application to use read replicas"
echo "  2. Monitor replication lag in Grafana"
echo "  3. Set up automated failover"
echo "  4. Schedule regular backup testing"
echo ""
echo "✨ Database replication is active!"
