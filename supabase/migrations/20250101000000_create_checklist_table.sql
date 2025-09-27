-- Create checklist table for storing FEMA-based emergency preparedness items
CREATE TABLE IF NOT EXISTS public.checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  item_key text NOT NULL,
  quantity_needed integer NOT NULL,
  unit text NOT NULL,
  hazard_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklist_household_id ON public.checklist(household_id);
CREATE INDEX IF NOT EXISTS idx_checklist_hazard_type ON public.checklist(hazard_type);
CREATE INDEX IF NOT EXISTS idx_checklist_item_key ON public.checklist(item_key);

-- Enable Row Level Security
ALTER TABLE public.checklist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for checklist
CREATE POLICY "Users can view checklist items for their households" ON public.checklist
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM memberships 
      WHERE account_id IN (
        SELECT id FROM accounts WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage checklist items for their households" ON public.checklist
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM memberships 
      WHERE account_id IN (
        SELECT id FROM accounts WHERE user_id = auth.uid()
      )
    )
  );
