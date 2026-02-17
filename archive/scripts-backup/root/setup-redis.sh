#!/bin/bash
# Copyright © 2025 Infæmous Freight. All Rights Reserved.
# Redis Setup Script for 100% Unlocked Configuration

set -e

echo "📮 Redis Setup for 100% Unlocked Configuration"
echo "════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if REDIS_URL is set
if [ -z "$REDIS_URL" ]; then
    echo -e "${YELLOW}⚠️  REDIS_URL not set${NC}"
    echo "Set REDIS_URL in .env or environment"
fi

echo "📊 Recommended Redis Settings for 100% Unlocked:"
echo ""

cat << 'EOF'
# ============================================
# Redis Configuration (redis.conf)
# ============================================

# Memory Management
maxmemory 2gb
maxmemory-policy allkeys-lru              # Evict least recently used keys

# Network
maxclients 10000                          # Maximum client connections
timeout 300                               # Close idle connections after 5 min
tcp-keepalive 60                          # Keep TCP connection alive

# Persistence (if needed)
save 900 1                                # Save if 1 key changed in 15 min
save 300 10                               # Save if 10 keys changed in 5 min
save 60 10000                             # Save if 10k keys changed in 1 min
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes

# Performance
# Enable keyspace notifications if using Bull queues
notify-keyspace-events Kx

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Security
requirepass ${REDIS_PASSWORD}
# bind 127.0.0.1                          # Uncomment for local only

# Advanced
tcp-backlog 511
databases 16
replica-serve-stale-data yes
replica-read-only yes
repl-diskless-sync no
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes

EOF

echo ""
echo "─────────────────────────────────────────────"
echo ""

# Try to connect and check settings
if command -v redis-cli &> /dev/null; then
    echo "🔧 Checking Redis settings..."
    echo ""
    
    # Extract Redis connection details
    REDIS_HOST=$(echo $REDIS_URL | sed -n 's/.*@\([^:]*\).*/\1/p' || echo "localhost")
    REDIS_PORT=$(echo $REDIS_URL | sed -n 's/.*:\([0-9]*\)$/\1/p' || echo "6379")
    
    # Try to connect
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" PING 2>/dev/null | grep -q PONG; then
        echo -e "${GREEN}✅ Connected to Redis${NC}"
        echo ""
        
        # Check maxmemory
        MAX_MEM=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" CONFIG GET maxmemory 2>/dev/null | tail -1)
        if [ "$MAX_MEM" = "0" ]; then
            echo -e "${YELLOW}⚠️  maxmemory not set (unlimited)${NC}"
            echo "Set maxmemory to prevent OOM:"
            echo "  redis-cli CONFIG SET maxmemory 2gb"
            echo "  redis-cli CONFIG SET maxmemory-policy allkeys-lru"
            echo ""
        else
            MAX_MEM_GB=$(echo "scale=2; $MAX_MEM / 1024 / 1024 / 1024" | bc)
            echo -e "${GREEN}✅ maxmemory: ${MAX_MEM_GB}GB${NC}"
        fi
        
        # Check memory usage
        USED_MEM=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        echo -e "Current usage: ${YELLOW}$USED_MEM${NC}"
        
        # Check connected clients
        CLIENTS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" INFO clients | grep connected_clients | cut -d: -f2 | tr -d '\r')
        echo -e "Connected clients: ${YELLOW}$CLIENTS${NC}"
        
        # Check keyspace
        KEYS=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" DBSIZE 2>/dev/null)
        echo -e "Total keys: ${YELLOW}$KEYS${NC}"
        
        echo ""
        echo "─────────────────────────────────────────────"
        echo ""
        echo "Apply recommended settings:"
        echo ""
        echo "redis-cli -h $REDIS_HOST -p $REDIS_PORT -a \$REDIS_PASSWORD << 'REDISEOF'"
        echo "CONFIG SET maxmemory 2gb"
        echo "CONFIG SET maxmemory-policy allkeys-lru"
        echo "CONFIG SET maxclients 10000"
        echo "CONFIG SET timeout 300"
        echo "CONFIG SET tcp-keepalive 60"
        echo "CONFIG REWRITE"
        echo "REDISEOF"
        
    else
        echo -e "${RED}❌ Cannot connect to Redis${NC}"
        echo "Check REDIS_URL and redis-cli authentication"
    fi
else
    echo -e "${YELLOW}⚠️  redis-cli not available${NC}"
    echo ""
    echo "Install redis-cli:"
    echo "  brew install redis  # macOS"
    echo "  sudo apt-get install redis-tools  # Debian/Ubuntu"
fi

echo ""
echo "═════════════════════════════════════════════"
echo ""
echo "📚 Redis Monitoring Commands:"
echo ""
echo "# Monitor real-time operations"
echo "redis-cli MONITOR"
echo ""
echo "# Get memory statistics"
echo "redis-cli INFO memory"
echo ""
echo "# Get stats"
echo "redis-cli INFO stats"
echo ""
echo "# Check slow log"
echo "redis-cli SLOWLOG GET 10"
echo ""
echo "# Monitor client connections"
echo "redis-cli CLIENT LIST"
echo ""
echo "═════════════════════════════════════════════"
echo ""

# Generate monitoring script
cat > monitor-redis.sh << 'REDISMONITOR'
#!/bin/bash
# Monitor Redis health

echo "Redis Health Check"
echo "=================="

redis-cli INFO server | grep redis_version
redis-cli INFO memory | grep -E "used_memory_human|maxmemory_human"
redis-cli INFO stats | grep -E "total_connections_received|total_commands_processed"
redis-cli INFO clients | grep -E "connected_clients|blocked_clients"
redis-cli DBSIZE

echo ""
echo "Checking for slow operations..."
redis-cli SLOWLOG GET 5

REDISMONITOR

chmod +x monitor-redis.sh

echo "✅ Created monitor-redis.sh for health monitoring"
echo ""
echo "Run monitoring:"
echo "  ./monitor-redis.sh"
echo ""
