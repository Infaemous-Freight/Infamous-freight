-- Infamous Freight Enterprises - Seed Data
-- Initial data for development and testing

-- Insert demo organization
INSERT INTO public.organizations (id, name, slug, settings)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Infamous Freight Enterprises', 'infamous-freight', '{"features": ["shipment_tracking", "invoicing", "driver_management"], "timezone": "America/Los_Angeles"}'::JSONB)
ON CONFLICT (id) DO NOTHING;

-- Insert demo customers
INSERT INTO public.customers (id, organization_id, name, email, phone, company, address, billing_address)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Acme Corporation',
    'contact@acme.com',
    '+1-555-0100',
    'Acme Corp',
    '{"street": "123 Main St", "city": "San Francisco", "state": "CA", "country": "USA", "postal_code": "94102"}'::JSONB,
    '{"street": "123 Main St", "city": "San Francisco", "state": "CA", "country": "USA", "postal_code": "94102"}'::JSONB
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'TechStart Inc',
    'shipping@techstart.io',
    '+1-555-0200',
    'TechStart Inc',
    '{"street": "456 Market St", "city": "Los Angeles", "state": "CA", "country": "USA", "postal_code": "90001"}'::JSONB,
    '{"street": "456 Market St", "city": "Los Angeles", "state": "CA", "country": "USA", "postal_code": "90001"}'::JSONB
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Global Logistics',
    'ops@globallogistics.com',
    '+1-555-0300',
    'Global Logistics LLC',
    '{"street": "789 Commerce Blvd", "city": "Chicago", "state": "IL", "country": "USA", "postal_code": "60601"}'::JSONB,
    '{"street": "789 Commerce Blvd", "city": "Chicago", "state": "IL", "country": "USA", "postal_code": "60601"}'::JSONB
  )
ON CONFLICT (id) DO NOTHING;

-- Note: Users and drivers will be created through auth signup flow
-- This seed file focuses on reference data and organizational structure

-- Insert sample shipment statuses reference data (if you want predefined statuses)
-- This is optional since we use CHECK constraints

COMMENT ON TABLE public.customers IS 'Seed data inserted for development/testing';
