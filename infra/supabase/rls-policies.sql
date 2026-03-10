-- ============================================
-- Supabase Row Level Security (RLS) Policies
-- Infamous Freight Enterprises
-- ============================================
--
-- Run these SQL commands in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/wnaievjffghrztjuvutp/sql
--
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

-- Core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;

-- Billing & Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Marketplace
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_assets ENABLE ROW LEVEL SECURITY;

-- Multi-tenancy & Organization
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_audit_logs ENABLE ROW LEVEL SECURITY;

-- Compliance
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enforcement_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_certificates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (auth.uid()::text = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (authuid()::text = id);

-- Service role can do anything (for API)
CREATE POLICY "Service role full access" ON users
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- SHIPMENTS TABLE POLICIES
-- ============================================

-- Users can only see their own shipments
CREATE POLICY "Users can view own shipments" ON shipments
  FOR SELECT
  USING (auth.uid()::text = "userId");

-- Users can create shipments
CREATE POLICY "Users can create shipments" ON shipments
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- Users can update their own shipments
CREATE POLICY "Users can update own shipments" ON shipments
  FOR UPDATE
  USING (auth.uid()::text = "userId");

-- Drivers can view assigned shipments
CREATE POLICY "Drivers can view assigned shipments" ON shipments
  FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT id FROM drivers WHERE id = shipments."driverId"
    )
  );

-- Service role full access
CREATE POLICY "Service role full shipments access" ON shipments
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- ORGANIZATIONS TABLE POLICIES (Multi-tenancy)
-- ============================================

-- Users can view their own organization
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT "organizationId" FROM users WHERE id = auth.uid()::text
    )
  );

-- Admins can update their organization
CREATE POLICY "Admins can update organization" ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT "organizationId" FROM users 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- Service role full access
CREATE POLICY "Service role full org access" ON organizations
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- JOBS TABLE POLICIES (Marketplace)
-- ============================================

-- Shippers can view their own jobs
CREATE POLICY "Shippers can view own jobs" ON jobs
  FOR SELECT
  USING (auth.uid()::text = "shipperId");

-- Drivers can view jobs offered to them
CREATE POLICY "Drivers can view offered jobs" ON jobs
  FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT "driverId" FROM job_offers 
      WHERE "jobId" = jobs.id AND status = 'OFFERED'
    )
  );

-- Drivers can view accepted jobs
CREATE POLICY "Drivers can view accepted jobs" ON jobs
  FOR SELECT
  USING (auth.uid()::text = "driverId");

-- Shippers can create jobs in their organization
CREATE POLICY "Shippers can create jobs" ON jobs
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = "shipperId" AND
    "organizationId" IN (
      SELECT "organizationId" FROM users WHERE id = auth.uid()::text
    )
  );

-- Service role full access
CREATE POLICY "Service role full jobs access" ON jobs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- PAYMENTS TABLE POLICIES
-- ============================================

-- Users can only see their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT
  USING (auth.uid()::text = "userId");

-- Service role can manage all payments
CREATE POLICY "Service role full payments access" ON payments
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- JOB_PAYMENTS TABLE POLICIES
-- ============================================

-- Users can view payments for their jobs
CREATE POLICY "Users can view job payments" ON job_payments
  FOR SELECT
  USING (auth.uid()::text = "userId");

-- Service role full access
CREATE POLICY "Service role full job_payments access" ON job_payments
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- DRIVER_PROFILES TABLE POLICIES
-- ============================================

-- Drivers can view their own profile
CREATE POLICY "Drivers can view own profile" ON driver_profiles
  FOR SELECT
  USING (auth.uid()::text = "userId");

-- Drivers can update their own profile
CREATE POLICY "Drivers can update own profile" ON driver_profiles
  FOR UPDATE
  USING (auth.uid()::text = "userId");

-- Service role full access
CREATE POLICY "Service role full driver_profiles access" ON driver_profiles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- ORG_AUDIT_LOGS TABLE POLICIES
-- ============================================

-- Users can view audit logs for their organization
CREATE POLICY "Users can view org audit logs" ON org_audit_logs
  FOR SELECT
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM users WHERE id = auth.uid()::text
    )
  );

-- Service role can create audit logs
CREATE POLICY "Service role can create audit logs" ON org_audit_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- AI_EVENTS TABLE POLICIES
-- ============================================

-- Users can view their own AI events
CREATE POLICY "Users can view own AI events" ON ai_events
  FOR SELECT
  USING (auth.uid()::text = "userId");

-- Service role full access
CREATE POLICY "Service role full ai_events access" ON ai_events
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these after creating policies to verify RLS is enabled:

-- Check which tables have RLS enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- Check policies on a specific table
-- SELECT * FROM pg_policies 
-- WHERE tablename = 'users';

-- ============================================
-- NOTES
-- ============================================
--
-- 1. All policies use service_role for API access
-- 2. Users can only access their own data or organization data
-- 3. Drivers have limited access to assigned jobs/shipments
-- 4. Admins have additional privileges within their organization
-- 5. All sensitive tables are protected by RLS
--
-- To apply these policies:
-- 1. Copy this entire file
-- 2. Go to Supabase SQL Editor
-- 3. Paste and execute
-- 4. Verify with the verification queries at the end
--
-- ============================================
