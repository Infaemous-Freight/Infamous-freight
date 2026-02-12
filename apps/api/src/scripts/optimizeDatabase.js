/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Database Optimization & Index Management
 * 
 * Run with: npx ts-node apps/api/src/scripts/optimizeDatabase.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logger = console; // Use simple console for scripts

// Index definitions for Postgres
const INDEX_DEFINITIONS = [
    // Job table indexes
    {
        table: 'jobs',
        name: 'idx_jobs_status',
        columns: ['status'],
        type: 'BTREE',
        description: 'Speed up job listing by status',
    },
    {
        table: 'jobs',
        name: 'idx_jobs_shipper_id',
        columns: ['shipperId'],
        type: 'BTREE',
        description: 'Speed up shipper job lookup',
    },
    {
        table: 'jobs',
        name: 'idx_jobs_driver_id',
        columns: ['driverId'],
        type: 'BTREE',
        description: 'Speed up driver job lookup',
    },
    {
        table: 'jobs',
        name: 'idx_jobs_status_shipper',
        columns: ['status', 'shipperId'],
        type: 'BTREE',
        description: 'Speed up shipper job filtering by status',
    },
    {
        table: 'jobs',
        name: 'idx_jobs_created_at',
        columns: ['createdAt'],
        type: 'BTREE',
        description: 'Speed up time-based queries',
    },
    {
        table: 'jobs',
        name: 'idx_jobs_pickup_location',
        columns: ['pickupLat', 'pickupLng'],
        type: 'BTREE',
        description: 'Speed up geospatial queries',
    },

    // Payment table indexes
    {
        table: 'jobPayments',
        name: 'idx_payments_stripe_session',
        columns: ['stripeSessionId'],
        type: 'BTREE',
        description: 'Speed up Stripe webhook processing',
    },
    {
        table: 'jobPayments',
        name: 'idx_payments_job_id',
        columns: ['jobId'],
        type: 'BTREE',
        description: 'Speed up payment lookup by job',
    },
    {
        table: 'jobPayments',
        name: 'idx_payments_status',
        columns: ['status'],
        type: 'BTREE',
        description: 'Speed up payment status queries',
    },
    {
        table: 'jobPayments',
        name: 'idx_payments_created_at',
        columns: ['createdAt'],
        type: 'BTREE',
        description: 'Speed up date-range queries',
    },

    // Driver profile indexes
    {
        table: 'driverProfiles',
        name: 'idx_drivers_user_id',
        columns: ['userId'],
        type: 'BTREE',
        description: 'Speed up driver profile lookup',
    },
    {
        table: 'driverProfiles',
        name: 'idx_drivers_location',
        columns: ['lat', 'lng'],
        type: 'BTREE',
        description: 'Speed up location-based driver searches',
    },
    {
        table: 'driverProfiles',
        name: 'idx_drivers_is_active',
        columns: ['isActive'],
        type: 'BTREE',
        description: 'Speed up active driver queries',
    },

    // Vehicle indexes
    {
        table: 'vehicles',
        name: 'idx_vehicles_driver_id',
        columns: ['driverId'],
        type: 'BTREE',
        description: 'Speed up vehicle lookup by driver',
    },

    // User table indexes
    {
        table: 'users',
        name: 'idx_users_email',
        columns: ['email'],
        type: 'BTREE',
        description: 'Speed up email lookups (unique constraint)',
    },
    {
        table: 'users',
        name: 'idx_users_stripe_customer_id',
        columns: ['stripeCustomerId'],
        type: 'BTREE',
        description: 'Speed up Stripe customer lookups',
    },
    {
        table: 'users',
        name: 'idx_users_plan_tier',
        columns: ['planTier'],
        type: 'BTREE',
        description: 'Speed up plan-based queries',
    },
];

async function createIndexes() {
    logger.log('🔧 Starting database optimization...');

    for (const index of INDEX_DEFINITIONS) {
        try {
            const columnList = index.columns.join(', ');
            const createIndexSQL = `
        CREATE INDEX IF NOT EXISTS ${index.name}
        ON ${index.table} (${columnList})
        USING ${index.type};
      `;

            await prisma.$executeRawUnsafe(createIndexSQL);
            logger.log(`✅ Created index: ${index.name} on ${index.table} (${index.description})`);
        } catch (err) {
            if (err.message.includes('already exists')) {
                logger.log(`⏭️  Index already exists: ${index.name}`);
            } else {
                logger.error(`❌ Failed to create index ${index.name}:`, err.message);
            }
        }
    }
}

async function analyzeIndexUsage() {
    logger.log('\n📊 Analyzing index usage...');

    try {
        const result = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC;
    `;

        logger.log('📈 Index Usage Statistics:');
        logger.table(result);
    } catch (err) {
        logger.error('Failed to analyze index usage:', err.message);
    }
}

async function identifySlowQueries() {
    logger.log('\n🐌 Identifying potentially slow queries...');

    try {
        // Check for unused indexes
        const unusedIndexes = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
      AND indexname NOT LIKE 'pg_toast%'
      ORDER BY pg_relation_size(indexrelid) DESC;
    `;

        if (unusedIndexes.length > 0) {
            logger.log('⚠️  Unused indexes (candidates for removal):');
            logger.table(unusedIndexes);
        } else {
            logger.log('✅ No unused indexes found');
        }

        // Check table sizes
        const tableSizes = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;

        logger.log('\n📦 Table Sizes:');
        logger.table(tableSizes);
    } catch (err) {
        logger.error('Failed to identify slow queries:', err.message);
    }
}

async function optimizeTableStats() {
    logger.log('\n🔍 Updating table statistics...');

    const tables = ['jobs', 'jobPayments', 'driverProfiles', 'vehicles', 'users'];

    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`ANALYZE ${table};`);
            logger.log(`✅ Analyzed table: ${table}`);
        } catch (err) {
            logger.error(`Failed to analyze ${table}:`, err.message);
        }
    }
}

async function getOptimizationReport() {
    logger.log('\n📋 Database Optimization Report');
    logger.log('='.repeat(60));

    try {
        // Database info
        const dbInfo = await prisma.$queryRaw`
      SELECT
        current_database(),
        pg_size_pretty(pg_database_size(current_database())) as database_size;
    `;
        logger.log('📊 Database Size:', dbInfo[0]);

        // Connection info
        const connInfo = await prisma.$queryRaw`
      SELECT count(*) as active_connections
      FROM pg_stat_activity
      WHERE datname = current_database();
    `;
        logger.log('🔗 Active Connections:', connInfo[0].active_connections);

        // Index info
        const indexCount = await prisma.$queryRaw`
      SELECT count(*) as total_indexes
      FROM pg_stat_user_indexes;
    `;
        logger.log('📑 Total Indexes:', indexCount[0].total_indexes);

        logger.log('='.repeat(60));
    } catch (err) {
        logger.error('Failed to generate report:', err.message);
    }
}

async function main() {
    try {
        await createIndexes();
        await analyzeIndexUsage();
        await identifySlowQueries();
        await optimizeTableStats();
        await getOptimizationReport();

        logger.log('\n✅ Database optimization complete!');
    } catch (err) {
        logger.error('❌ Optimization failed:', err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { createIndexes, analyzeIndexUsage, identifySlowQueries };
