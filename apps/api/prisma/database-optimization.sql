-- Database Optimization: Composite Indexes & Query Plans
-- 
-- Run these migrations to optimize database performance
-- Execute: psql $DATABASE_URL -f database-optimization.sql

-- ========================================
-- 1. COMPOSITE INDEXES FOR COMMON QUERIES
-- ========================================

-- User queries: Most common filter by role + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_created 
  ON users(role, "createdAt" DESC);

-- Shipment queries: Filter by status + user + date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_user_status_created
  ON shipments("userId", status, "createdAt" DESC);

-- Shipment tracking: Find by tracking ID
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_tracking_id
  ON shipments("trackingId") 
  WHERE status != 'archived';

-- Driver availability: Find available drivers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_status_created
  ON drivers(status, "createdAt" DESC)
  WHERE status = 'available';

-- Payment queries: Filter by user + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user_status
  ON payments("userId", status, "createdAt" DESC);

-- Subscription queries: Active subscriptions by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions("userId", status)
  WHERE status = 'active';

-- Stripe customer lookup: Fast reverse lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stripe_customers_user_id
  ON stripe_customers("userId");

-- AI events: Query by provider + date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_events_provider_created
  ON ai_events(provider, "createdAt" DESC);

-- ========================================
-- 2. PARTIAL INDEXES (Reduce index size)
-- ========================================

-- Index only non-deleted shipments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_active
  ON shipments("createdAt" DESC, "updatedAt" DESC)
  WHERE status != 'archived';

-- Index only pending shipments (for real-time queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_pending
  ON shipments(id, "driverId", "userId")
  WHERE status = 'pending';

-- ========================================
-- 3. PERFORMANCE MONITORING QUERIES
-- ========================================

-- Analyze index usage
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- Find slow queries
-- SELECT query, mean_exec_time, calls
-- FROM pg_stat_statements
-- WHERE mean_exec_time > 100
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- Find missing indexes
-- SELECT schemaname, tablename, attname
-- FROM pg_stat_user_tables t
-- JOIN pg_attribute a ON a.attrelid = t.relid
-- WHERE seq_scan > 1000
-- ORDER BY seq_scan DESC;

-- ========================================
-- 4. QUERY OPTIMIZATION RECOMMENDATIONS
-- ========================================

-- ❌ BAD: Full table scan with subquery
-- SELECT * FROM shipments 
-- WHERE user_id IN (SELECT id FROM users WHERE role = 'admin')
-- ORDER BY created_at DESC;

-- ✅ GOOD: Use JOIN with index
-- SELECT s.* FROM shipments s
-- INNER JOIN users u ON s.user_id = u.id
-- WHERE u.role = 'admin'
-- ORDER BY s.created_at DESC;

-- ❌ BAD: Multiple OR conditions
-- SELECT * FROM shipments 
-- WHERE status = 'pending' 
-- OR status = 'in_transit'
-- OR status = 'delayed';

-- ✅ GOOD: Use IN clause
-- SELECT * FROM shipments 
-- WHERE status = ANY(ARRAY['pending', 'in_transit', 'delayed']);

-- ❌ BAD: LIKE with leading wildcard
-- SELECT * FROM users WHERE email LIKE '%@gmail.com';

-- ✅ GOOD: Use trigram index for text search
-- CREATE INDEX CONCURRENTLY idx_users_email_trgm ON users USING GIN(email gin_trgm_ops);

-- ========================================
-- 5. VACUUM & ANALYZE STRATEGY
-- ========================================

-- Run weekly maintenance
-- VACUUM ANALYZE users;
-- VACUUM ANALYZE shipments;
-- VACUUM ANALYZE payments;

-- ========================================
-- 6. CONNECTION POOLING CONFIGURATION
-- ========================================

-- Add to .env for optimal connection pooling:
-- DATABASE_POOL_MIN=5       # Minimum connections
-- DATABASE_POOL_MAX=20      # Maximum connections
-- DATABASE_POOL_IDLE=30     # Idle timeout (seconds)

-- ========================================
-- 7. PARTITIONING FOR LARGE TABLES (future)
-- ========================================

-- For tables with >100M rows, use time-based partitioning:
-- CREATE TABLE shipments_2026_q1 PARTITION OF shipments
--   FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

-- ========================================
-- 8. STATISTICS & MONITORING
-- ========================================

-- Enable extended statistics for query planner
CREATE STATISTICS IF NOT EXISTS users_role_status 
  ON role, "createdAt" FROM users;

CREATE STATISTICS IF NOT EXISTS shipments_status_date
  ON status, "createdAt" FROM shipments;

-- Analyze statistics
ANALYZE users;
ANALYZE shipments;
ANALYZE payments;
ANALYZE subscriptions;
ANALYZE drivers;
ANALYZE stripe_customers;

-- ========================================
-- 9. TABLE BLOAT MONITORING
-- ========================================

-- Check table bloat (should be < 30%)
-- SELECT schemaname, tablename, 
--   ROUND(100*live_tuples/NULLIF(n_live_tup+n_dead_tup,0),2) as live_ratio
-- FROM pg_stat_user_tables
-- WHERE n_live_tup > 0
-- ORDER BY live_ratio ASC;

-- ========================================
-- 10. CACHE WARMER RECOMMENDATIONS
-- ========================================

-- Pre-cache hot data after deployment
-- SELECT COUNT(*) FROM shipments WHERE status IN ('pending', 'in_transit');
-- SELECT COUNT(*) FROM users WHERE role = 'admin';
-- SELECT COUNT(*) FROM payments WHERE status = 'pending';
