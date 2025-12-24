-- Migration: Add old_invoices table
-- Description: Legacy/historical PDF invoice files for passengers
-- Date: 2024-12-24
-- Run this SQL on each tenant database to add the old_invoices table

CREATE TABLE IF NOT EXISTS old_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  invoice_date TIMESTAMP,
  uploaded_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_old_invoices_user_id ON old_invoices(user_id);

-- Create index for sorting by invoice date
CREATE INDEX IF NOT EXISTS idx_old_invoices_invoice_date ON old_invoices(invoice_date DESC);

COMMENT ON TABLE old_invoices IS 'Stores legacy/historical PDF invoice files uploaded by admins for passengers';
COMMENT ON COLUMN old_invoices.user_id IS 'The passenger user who owns this invoice';
COMMENT ON COLUMN old_invoices.file_name IS 'Original filename of the uploaded PDF';
COMMENT ON COLUMN old_invoices.file_url IS 'Storage path/URL to the PDF file';
COMMENT ON COLUMN old_invoices.file_size IS 'File size in bytes';
COMMENT ON COLUMN old_invoices.description IS 'Optional description or notes about this invoice';
COMMENT ON COLUMN old_invoices.invoice_date IS 'The date on the invoice (for display/sorting)';
COMMENT ON COLUMN old_invoices.uploaded_by IS 'Admin user who uploaded this invoice';
