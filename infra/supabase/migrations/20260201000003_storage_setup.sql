-- Infamous Freight Enterprises - Storage Buckets Configuration
-- Create storage buckets for file uploads

-- Create bucket for shipment documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shipment-documents',
  'shipment-documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for driver documents (licenses, certifications)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-documents',
  'driver-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for invoices
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for organization logos (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-logos',
  'organization-logos',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for user avatars (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  1048576, -- 1MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies
-- ============================================

-- Shipment Documents Policies
CREATE POLICY "Users can view shipment documents in their organization"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'shipment-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.shipments
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload shipment documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shipment-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.shipments
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their shipment documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'shipment-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.shipments
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Driver Documents Policies
CREATE POLICY "Drivers can view their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'driver-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can upload their documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'driver-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all driver documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'driver-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.drivers
      WHERE organization_id IN (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );

-- Invoice Policies
CREATE POLICY "Users can view invoices in their organization"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.invoices
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Managers can upload invoices"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'invoices' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Organization Logos Policies (public bucket)
CREATE POLICY "Anyone can view organization logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'organization-logos');

CREATE POLICY "Admins can upload organization logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'organization-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM public.organizations
      WHERE id IN (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Avatar Policies (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

COMMENT ON POLICY "Users can view shipment documents in their organization" ON storage.objects IS 'Allow users to view documents for shipments in their organization';
COMMENT ON POLICY "Drivers can view their own documents" ON storage.objects IS 'Allow drivers to view their uploaded documents';
COMMENT ON POLICY "Anyone can view organization logos" ON storage.objects IS 'Public access to organization branding';
