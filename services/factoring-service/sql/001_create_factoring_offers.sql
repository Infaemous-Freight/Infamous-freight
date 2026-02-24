CREATE TABLE IF NOT EXISTS factoring_offers (
  id UUID PRIMARY KEY,
  invoice_id UUID NOT NULL,
  partner_name TEXT NOT NULL,
  advance_rate NUMERIC(5,2) NOT NULL,
  fee_percentage NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
