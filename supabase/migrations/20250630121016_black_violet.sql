/*
  # Add currency field to expenses table

  1. Changes
    - Add `currency` column to expenses table with default 'USD'

  2. Notes
    - This allows users to track expenses in different currencies
*/

-- Add currency column to expenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'currency'
  ) THEN
    ALTER TABLE expenses ADD COLUMN currency text DEFAULT 'USD';
  END IF;
END $$;