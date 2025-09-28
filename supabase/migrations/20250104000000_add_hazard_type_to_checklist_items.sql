-- Add hazard_type column to checklist_items table
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS hazard_type text CHECK (hazard_type IN ('hurricane', 'wildfire', 'flood', 'earthquake', 'tornado', 'heat'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_checklist_items_household_hazard 
ON checklist_items(household_id, hazard_type);
