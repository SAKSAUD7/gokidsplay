-- Add min_hours_before_slot column to shop_voucher table
-- This is a manual fix for the migration that didn't run on Azure

ALTER TABLE shop_voucher 
ADD COLUMN IF NOT EXISTS min_hours_before_slot INTEGER DEFAULT 0;

-- Add comment to the column
COMMENT ON COLUMN shop_voucher.min_hours_before_slot IS 'Minimum hours required between current time and booking slot. 0 = no restriction.';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'shop_voucher' 
AND column_name = 'min_hours_before_slot';
