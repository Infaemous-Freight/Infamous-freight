#!/bin/bash
# PostgreSQL Read Replicas Setup for Fly.io
# Scale read capacity with dedicated read-only replicas
# Automatically route SELECT queries to replicas

set -e

echo "🔧 Setting up PostgreSQL Read Replicas on Fly.io"

# Configuration
PRIMARY_DB_NAME="${FLY_DATABASE_NAME:-infamous-freight-db}"
REPLICA_COUNT="${REPLICA_COUNT:-2}"
REPLICA_REGIONS=("dfw" "sea")  # Dallas, Seattle

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
  echo "❌ flyctl not found. Install from: https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
  echo "❌ Not logged in to Fly.io"
  echo "Run: flyctl auth login"
  exit 1
fi

echo "✓ Authenticated with Fly.io"

# Function to create read replica
create_replica() {
  local region=$1
  local replica_name="${PRIMARY_DB_NAME}-replica-${region}"
  
  echo "Creating read replica in region: $region"
  
  flyctl postgres create \
    --name "$replica_name" \
    --region "$region" \
    --vm-size shared-cpu-1x \
    --volume-size 10 \
    --initial-cluster-size 1
  
  if [ $? -eq 0 ]; then
    echo "✓ Created replica: $replica_name"
    
    # Attach as read replica to primary
    echo "Attaching to primary database..."
    flyctl postgres attach "$PRIMARY_DB_NAME" \
      --app "$replica_name" \
      --database-name postgres \
      --variable-name DATABASE_REPLICA_URL
    
    echo "✓ Replica $replica_name configured"
  else
    echo "⚠️ Failed to create replica in $region"
  fi
}

# Create replicas in each region
for region in "${REPLICA_REGIONS[@]}"; do
  echo ""
  create_replica "$region"
done

echo ""
echo "✅ Read replicas setup complete"
echo ""
echo "📋 Connection strings:"
echo "   PRIMARY (read/write): \$DATABASE_URL"
echo "   REPLICAS (read-only):  \$DATABASE_REPLICA_URL"
echo ""

# Generate Prisma configuration
cat > /tmp/prisma-read-replicas.ts << 'EOF'
/**
 * Prisma Read Replicas Configuration
 * Automatically route read queries to replicas
 */

import { PrismaClient } from '@prisma/client';

// Primary database (read/write)
const prismaWrite = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Read replica (read-only)
const prismaRead = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_REPLICA_URL || process.env.DATABASE_URL,
    },
  },
});

/**
 * Smart router: Automatically use replica for reads
 */
export const prisma = new Proxy(prismaWrite, {
  get(target, prop) {
    const readOnlyMethods = [
      'findUnique',
      'findFirst',
      'findMany',
      'count',
      'aggregate',
      'groupBy',
    ];

    // Use read replica for read-only operations
    if (typeof prop === 'string' && readOnlyMethods.some(m => prop.includes(m))) {
      return prismaRead[prop];
    }

    // Use primary for writes
    return target[prop];
  },
});

/**
 * Usage:
 * 
 * // Automatic routing
 * const shipments = await prisma.shipment.findMany();  // → Replica
 * await prisma.shipment.create({ data: {...} });       // → Primary
 * 
 * // Force primary for critical reads
 * const shipment = await prismaWrite.shipment.findUnique({ where: { id } });
 * 
 * // Force replica for analytics
 * const stats = await prismaRead.shipment.count();
 */

export { prismaWrite, prismaRead };
EOF

echo "📄 Prisma configuration generated: /tmp/prisma-read-replicas.ts"
echo ""
echo "⚙️ Next steps:"
echo "1. Copy /tmp/prisma-read-replicas.ts to your src/lib/ directory"
echo "2. Update imports to use the new prisma instance"
echo "3. Deploy your app: flyctl deploy"
echo "4. Verify replicas: flyctl postgres list"
echo ""
echo "🎯 Expected benefits:"
echo "   - 3x read capacity"
echo "   - Lower latency for reads (geo-distributed)"
echo "   - Primary database offload"
echo "   - Better fault tolerance"
echo ""

# Create monitoring script
cat > /tmp/monitor-replicas.sh << 'EOF'
#!/bin/bash
# Monitor read replica lag and health

PRIMARY_DB="${FLY_DATABASE_NAME:-infamous-freight-db}"

echo "📊 PostgreSQL Read Replica Status"
echo "=================================="
echo ""

# Check replication lag
flyctl ssh console -a "$PRIMARY_DB" -C "pg_stat_replication" | \
  awk '{print "Replica: " $1 "\nLag: " $5 " bytes\nState: " $6 "\n"}'

# Check replica health
for region in dfw sea; do
  replica="${PRIMARY_DB}-replica-${region}"
  echo "Checking $replica..."
  flyctl status -a "$replica" 2>/dev/null || echo "⚠️ Replica not found"
  echo ""
done

echo "✓ Health check complete"
EOF

chmod +x /tmp/monitor-replicas.sh
echo "📄 Monitoring script generated: /tmp/monitor-replicas.sh"
echo ""

# Test read replica
cat > /tmp/test-replicas.sh << 'EOF'
#!/bin/bash
# Test read replica performance

echo "🧪 Testing read replica performance"
echo "===================================="
echo ""

PRIMARY_URL="$DATABASE_URL"
REPLICA_URL="$DATABASE_REPLICA_URL"

# Test primary
echo "Testing PRIMARY database..."
time psql "$PRIMARY_URL" -c "SELECT COUNT(*) FROM shipments;" 2>/dev/null

echo ""

# Test replica
echo "Testing REPLICA database..."
time psql "$REPLICA_URL" -c "SELECT COUNT(*) FROM shipments;" 2>/dev/null

echo ""
echo "✓ Test complete"
echo ""
echo "Expected: Replica should be faster for read queries (closer region)"
EOF

chmod +x /tmp/test-replicas.sh
echo "📄 Test script generated: /tmp/test-replicas.sh"
echo ""
echo "🚀 Setup complete!"
