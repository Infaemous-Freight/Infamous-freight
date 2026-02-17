#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Database Setup Script for 100% Unlocked Configuration

set -e

echo "🗄️  PostgreSQL Setup for 100% Unlocked Configuration"
echo "════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    echo "Set DATABASE_URL in .env or environment"
    exit 1
fi

echo "📊 Recommended PostgreSQL Settings for 100% Unlocked:"
echo ""

cat << 'EOF'
# ============================================
# PostgreSQL Configuration (postgresql.conf)
# ============================================

# Connection Settings
max_connections = 250                    # Allow 200 app + 50 buffer
superuser_reserved_connections = 10

# Memory Settings (adjust based on your RAM)
shared_buffers = 4GB                     # 25% of RAM for 16GB system
effective_cache_size = 12GB              # 75% of RAM
work_mem = 20MB                          # Per query operation
maintenance_work_mem = 1GB               # For VACUUM, CREATE INDEX

# Query Planning
random_page_cost = 1.1                   # For SSD storage
effective_io_concurrency = 200           # For SSD

# Write-Ahead Log (WAL)
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# Parallel Query Settings
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8

# Query Timeouts (matching app config)
statement_timeout = 60000                # 60 seconds
idle_in_transaction_session_timeout = 120000  # 2 minutes

# Logging (for performance monitoring)
log_min_duration_statement = 1000        # Log queries >1s
log_connections = on
log_disconnections = on
log_line_prefix = '%t [%p]: user=%u,db=%d,app=%a,client=%h '

# Connection Pooling (if using PgBouncer)
# pool_mode = transaction
# max_client_conn = 1000
# default_pool_size = 25

EOF

echo ""
echo "─────────────────────────────────────────────────────────"
echo ""

# Try to apply settings if psql is available
if command -v psql &> /dev/null; then
    echo "🔧 Checking if we can apply settings..."
    echo ""
    
    # Check current max_connections
    CURRENT_CONN=$(psql "$DATABASE_URL" -t -c "SHOW max_connections;" 2>/dev/null | xargs || echo "0")
    
    if [ "$CURRENT_CONN" != "0" ]; then
        echo -e "Current max_connections: ${YELLOW}$CURRENT_CONN${NC}"
        
        if [ "$CURRENT_CONN" -lt 250 ]; then
            echo -e "${YELLOW}⚠️  max_connections should be ≥250 for 100% unlocked config${NC}"
            echo ""
            echo "To increase (requires PostgreSQL restart):"
            echo ""
            echo "  ALTER SYSTEM SET max_connections = 250;"
            echo "  SELECT pg_reload_conf();"
            echo ""
            echo "Or edit postgresql.conf and restart PostgreSQL"
        else
            echo -e "${GREEN}✅ max_connections is sufficient: $CURRENT_CONN${NC}"
        fi
        
        echo ""
        echo "─────────────────────────────────────────────────────────"
        echo ""
        
        # Check shared_buffers
        CURRENT_BUFFERS=$(psql "$DATABASE_URL" -t -c "SHOW shared_buffers;" 2>/dev/null | xargs || echo "unknown")
        echo -e "Current shared_buffers: ${YELLOW}$CURRENT_BUFFERS${NC}"
        
        # Check work_mem
        CURRENT_WORK_MEM=$(psql "$DATABASE_URL" -t -c "SHOW work_mem;" 2>/dev/null | xargs || echo "unknown")
        echo -e "Current work_mem: ${YELLOW}$CURRENT_WORK_MEM${NC}"
        
    else
        echo -e "${RED}❌ Cannot connect to database${NC}"
        echo "Check DATABASE_URL and network connectivity"
    fi
else
    echo -e "${YELLOW}⚠️  psql not available - cannot check current settings${NC}"
    echo ""
    echo "Install psql to check/apply settings:"
    echo "  brew install postgresql  # macOS"
    echo "  sudo apt-get install postgresql-client  # Debian/Ubuntu"
fi

echo ""
echo "═════════════════════════════════════════════════════════"
echo ""
echo "📚 Additional Recommendations:"
echo ""
echo "1. Connection Pooling:"
echo "   Use PgBouncer for efficient connection management"
echo "   https://www.pgbouncer.org/"
echo ""
echo "2. Monitoring:"
echo "   - pg_stat_statements extension for query analysis"
echo "   - pg_stat_activity for connection monitoring"
echo "   - Datadog PostgreSQL integration"
echo ""
echo "3. Backups:"
echo "   - Enable point-in-time recovery (PITR)"
echo "   - Test recovery procedures regularly"
echo "   - Store backups in separate region"
echo ""
echo "4. High Availability:"
echo "   - Configure streaming replication"
echo "   - Set up automatic failover (Patroni, Stolon)"
echo "   - Use connection pooling with health checks"
echo ""
echo "═════════════════════════════════════════════════════════"
echo ""

# Generate SQL script for monitoring queries
cat > monitor-db.sql << 'EOSQL'
-- Database Monitoring Queries for 100% Unlocked Config

-- Current connections by state
SELECT 
    state,
    count(*) as connections,
    max_connections::int as max_connections
FROM pg_stat_activity, 
     (SELECT setting::int as max_connections FROM pg_settings WHERE name = 'max_connections') AS mc
GROUP BY state, max_connections
ORDER BY connections DESC;

-- Slow queries (last 7 days)
SELECT 
    calls,
    round(total_exec_time::numeric / 1000, 2) as total_time_seconds,
    round(mean_exec_time::numeric, 2) as avg_time_ms,
    substring(query, 1, 100) as query_preview
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- > 1 second
ORDER BY total_exec_time DESC
LIMIT 10;

-- Database size
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Table sizes (top 10)
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Connection pool usage
SELECT 
    usename,
    application_name,
    count(*) as connections,
    state
FROM pg_stat_activity
WHERE state IS NOT NULL
GROUP BY usename, application_name, state
ORDER BY connections DESC;

EOSQL

echo "✅ Created monitor-db.sql with monitoring queries"
echo ""
echo "Run monitoring queries:"
echo "  psql \$DATABASE_URL -f monitor-db.sql"
echo ""
