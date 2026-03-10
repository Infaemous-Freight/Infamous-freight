-- Infamous Freight Enterprises - Initial Database Schema
-- Create all core tables for freight management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================
-- Organizations Table (Multi-tenancy support)
-- ============================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_organizations_slug ON public.organizations(slug) WHERE deleted_at IS NULL;

-- ============================================
-- Users Table (Extended auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'dispatcher', 'driver', 'user')),
  phone TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

CREATE INDEX idx_users_organization ON public.users(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

-- ============================================
-- Drivers Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  license_expiry DATE,
  vehicle_type TEXT,
  vehicle_number TEXT,
  rating DECIMAL(3,2) DEFAULT 5.00,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline', 'on_leave')),
  current_location JSONB, -- {lat, lng, updated_at}
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_organization ON public.drivers(organization_id);
CREATE INDEX idx_drivers_user ON public.drivers(user_id);
CREATE INDEX idx_drivers_status ON public.drivers(status);

-- ============================================
-- Customers Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address JSONB, -- {street, city, state, country, postal_code}
  billing_address JSONB,
  tax_id TEXT,
  payment_terms INTEGER DEFAULT 30, -- Days
  credit_limit DECIMAL(12,2),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_organization ON public.customers(organization_id);
CREATE INDEX idx_customers_email ON public.customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_phone ON public.customers(phone) WHERE phone IS NOT NULL;

-- ============================================
-- Shipments Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  tracking_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled')),
  
  -- Origin and destination
  origin_address JSONB NOT NULL,
  destination_address JSONB NOT NULL,
  
  -- Cargo details
  cargo_description TEXT,
  cargo_weight DECIMAL(10,2), -- kg
  cargo_volume DECIMAL(10,2), -- cubic meters
  cargo_value DECIMAL(12,2),
  
  -- Scheduling
  pickup_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  
  -- Financial
  quoted_price DECIMAL(12,2),
  final_price DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  
  -- Additional data
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  special_instructions TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_organization ON public.shipments(organization_id);
CREATE INDEX idx_shipments_customer ON public.shipments(customer_id);
CREATE INDEX idx_shipments_driver ON public.shipments(driver_id);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_tracking ON public.shipments(tracking_number);
CREATE INDEX idx_shipments_dates ON public.shipments(pickup_date, delivery_date);

-- ============================================
-- Shipment Events Table (Activity Log)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'delayed', 'location_update', 'note_added')),
  description TEXT,
  location JSONB, -- {lat, lng, address}
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipment_events_shipment ON public.shipment_events(shipment_id, created_at DESC);
CREATE INDEX idx_shipment_events_type ON public.shipment_events(event_type);

-- ============================================
-- Invoices Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  
  -- Financial details
  subtotal DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Payment details
  payment_method TEXT,
  payment_reference TEXT,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_organization ON public.invoices(organization_id);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_dates ON public.invoices(issue_date, due_date);

-- ============================================
-- Invoice Line Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_shipment ON public.invoice_items(shipment_id);

-- ============================================
-- Audit Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_organization ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================
-- Functions
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT AS $$
DECLARE
  tracking_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    tracking_num := 'IFE-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 10));
    SELECT COUNT(*) INTO exists_check FROM public.shipments WHERE tracking_number = tracking_num;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN tracking_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  invoice_num TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    invoice_num := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT COUNT(*) INTO exists_check FROM public.invoices WHERE invoice_number = invoice_num;
    EXIT WHEN exists_check = 0;
  END LOOP;
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views for common queries
-- ============================================

-- Active shipments view
CREATE OR REPLACE VIEW public.active_shipments AS
SELECT 
  s.*,
  c.name AS customer_name,
  c.email AS customer_email,
  d.license_number AS driver_license,
  u.display_name AS driver_name
FROM public.shipments s
LEFT JOIN public.customers c ON s.customer_id = c.id
LEFT JOIN public.drivers d ON s.driver_id = d.id
LEFT JOIN public.users u ON d.user_id = u.id
WHERE s.status IN ('pending', 'assigned', 'in_transit');

-- Driver performance view
CREATE OR REPLACE VIEW public.driver_performance AS
SELECT 
  d.id,
  d.license_number,
  u.display_name,
  d.rating,
  COUNT(s.id) AS total_deliveries,
  COUNT(CASE WHEN s.status = 'delivered' THEN 1 END) AS completed_deliveries,
  AVG(EXTRACT(EPOCH FROM (s.actual_delivery - s.estimated_delivery))) / 3600 AS avg_delay_hours
FROM public.drivers d
LEFT JOIN public.users u ON d.user_id = u.id
LEFT JOIN public.shipments s ON d.id = s.driver_id
GROUP BY d.id, d.license_number, u.display_name, d.rating;

-- Customer invoices summary view
CREATE OR REPLACE VIEW public.customer_invoices_summary AS
SELECT 
  c.id AS customer_id,
  c.name AS customer_name,
  COUNT(i.id) AS total_invoices,
  SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END) AS total_paid,
  SUM(CASE WHEN i.status = 'overdue' THEN i.total_amount ELSE 0 END) AS total_overdue,
  SUM(CASE WHEN i.status IN ('sent', 'draft') THEN i.total_amount ELSE 0 END) AS total_pending
FROM public.customers c
LEFT JOIN public.invoices i ON c.id = i.customer_id
GROUP BY c.id, c.name;

COMMENT ON TABLE public.organizations IS 'Multi-tenant organizations for freight management';
COMMENT ON TABLE public.users IS 'Extended user profiles linked to auth.users';
COMMENT ON TABLE public.drivers IS 'Driver profiles with licensing and vehicle information';
COMMENT ON TABLE public.customers IS 'Customer accounts for freight services';
COMMENT ON TABLE public.shipments IS 'Core shipment tracking and management';
COMMENT ON TABLE public.shipment_events IS 'Activity log for shipment lifecycle events';
COMMENT ON TABLE public.invoices IS 'Invoices for completed shipments';
COMMENT ON TABLE public.invoice_items IS 'Line items for invoices';
COMMENT ON TABLE public.audit_logs IS 'System-wide audit trail';
