-- Infamous Freight Enterprises - Row Level Security (RLS) Policies
-- Enable RLS and create security policies for all tables

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Organizations Policies
-- ============================================

-- Users can view their own organization
CREATE POLICY "Users can view their own organization"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Admins can update their organization
CREATE POLICY "Admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Users Policies
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid());

-- Users can view profiles in their organization
CREATE POLICY "Users can view organization members"
  ON public.users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can insert users in their organization
CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update users in their organization
CREATE POLICY "Admins can update organization users"
  ON public.users FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Drivers Policies
-- ============================================

-- Users can view drivers in their organization
CREATE POLICY "Users can view organization drivers"
  ON public.drivers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Drivers can view their own profile
CREATE POLICY "Drivers can view their own profile"
  ON public.drivers FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Drivers can update their own profile
CREATE POLICY "Drivers can update their own profile"
  ON public.drivers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Managers and admins can manage drivers
CREATE POLICY "Managers can manage drivers"
  ON public.drivers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- ============================================
-- Customers Policies
-- ============================================

-- Users can view customers in their organization
CREATE POLICY "Users can view organization customers"
  ON public.customers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Managers and admins can manage customers
CREATE POLICY "Managers can manage customers"
  ON public.customers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'dispatcher')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'dispatcher')
    )
  );

-- ============================================
-- Shipments Policies
-- ============================================

-- Users can view shipments in their organization
CREATE POLICY "Users can view organization shipments"
  ON public.shipments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Drivers can view their assigned shipments
CREATE POLICY "Drivers can view assigned shipments"
  ON public.shipments FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

-- Drivers can update their assigned shipments (limited fields)
CREATE POLICY "Drivers can update assigned shipments"
  ON public.shipments FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

-- Dispatchers and above can manage shipments
CREATE POLICY "Dispatchers can manage shipments"
  ON public.shipments FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'dispatcher')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'dispatcher')
    )
  );

-- ============================================
-- Shipment Events Policies
-- ============================================

-- Users can view events for shipments in their organization
CREATE POLICY "Users can view organization shipment events"
  ON public.shipment_events FOR SELECT
  USING (
    shipment_id IN (
      SELECT id FROM public.shipments 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Authenticated users can insert events for accessible shipments
CREATE POLICY "Users can insert shipment events"
  ON public.shipment_events FOR INSERT
  WITH CHECK (
    shipment_id IN (
      SELECT id FROM public.shipments 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- Invoices Policies
-- ============================================

-- Users can view invoices in their organization
CREATE POLICY "Users can view organization invoices"
  ON public.invoices FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Managers and admins can manage invoices
CREATE POLICY "Managers can manage invoices"
  ON public.invoices FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- ============================================
-- Invoice Items Policies
-- ============================================

-- Users can view invoice items for accessible invoices
CREATE POLICY "Users can view organization invoice items"
  ON public.invoice_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Managers can manage invoice items
CREATE POLICY "Managers can manage invoice items"
  ON public.invoice_items FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );

-- ============================================
-- Audit Logs Policies
-- ============================================

-- Admins can view audit logs for their organization
CREATE POLICY "Admins can view organization audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Helper Functions for RLS
-- ============================================

-- Function to check if user is admin in their organization
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is manager or above
CREATE OR REPLACE FUNCTION public.is_manager_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON POLICY "Users can view their own organization" ON public.organizations IS 'Allow users to view their organization';
COMMENT ON POLICY "Admins can update their organization" ON public.organizations IS 'Allow admins to update their organization';
COMMENT ON POLICY "Users can view their own profile" ON public.users IS 'Allow users to view their own profile';
COMMENT ON POLICY "Users can view organization members" ON public.users IS 'Allow users to view other members in their organization';
