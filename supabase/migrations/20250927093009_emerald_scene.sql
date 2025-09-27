/*
# Relief Ready Database Schema

1. Core Tables
   - `accounts` - User profiles with display names and photos
   - `households` - Family/group units with location data
   - `memberships` - User-household relationships with roles
   - `members` - Household members (family members)
   - `pets` - Household pets for emergency planning
   - `invites` - Household invitation system

2. Preparedness Tables  
   - `checklist_items` - AI-generated preparedness checklists
   - `inventory_items` - Household emergency supplies inventory
   - `donut_status` - Readiness percentages by hazard type
   - `nba_actions` - Next best actions recommendations

3. Security
   - Enable RLS on all tables
   - Add policies for authenticated users based on household membership
   - Protect sensitive data with appropriate access controls
*/

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name text NOT NULL,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  zip_code text NOT NULL,
  latitude decimal,
  longitude decimal,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(account_id, household_id)
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  age_group text CHECK (age_group IN ('infant', 'child', 'adult', 'senior')) NOT NULL,
  special_needs text,
  created_at timestamptz DEFAULT now()
);

-- Pets table
CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  size text CHECK (size IN ('small', 'medium', 'large')) NOT NULL,
  special_needs text,
  created_at timestamptz DEFAULT now()
);

-- Checklist items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  item_key text NOT NULL,
  description text NOT NULL,
  quantity_needed integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'item',
  priority text CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  item_key text NOT NULL,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'item',
  expiration_date date,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Donut status table
CREATE TABLE IF NOT EXISTS donut_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  hazard_type text CHECK (hazard_type IN ('hurricane', 'wildfire', 'flood', 'earthquake', 'tornado', 'heat')) NOT NULL,
  readiness_percentage integer NOT NULL DEFAULT 0 CHECK (readiness_percentage >= 0 AND readiness_percentage <= 100),
  last_updated timestamptz DEFAULT now(),
  UNIQUE(household_id, hazard_type)
);

-- Next best actions table
CREATE TABLE IF NOT EXISTS nba_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  item_key text,
  priority integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Invites table
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  created_by uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_by uuid REFERENCES accounts(id),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE donut_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE nba_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Accounts policies
CREATE POLICY "Users can view own account"
  ON accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own account"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own account"
  ON accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Memberships policies
CREATE POLICY "Users can view their memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their memberships"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

-- Households policies
CREATE POLICY "Household members can view household"
  ON households FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ));

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Household owners can update household"
  ON households FOR UPDATE
  TO authenticated
  USING (id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid() AND m.role = 'owner'
  ));

-- Members policies
CREATE POLICY "Household members can view members"
  ON members FOR SELECT
  TO authenticated
  USING (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ));

CREATE POLICY "Household members can manage members"
  ON members FOR ALL
  TO authenticated
  USING (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ))
  WITH CHECK (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ));

-- Pets policies
CREATE POLICY "Household members can view pets"
  ON pets FOR SELECT
  TO authenticated
  USING (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ));

CREATE POLICY "Household members can manage pets"
  ON pets FOR ALL
  TO authenticated
  USING (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ))
  WITH CHECK (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ));

-- Checklist items policies
CREATE POLICY "Household members can view checklist items"
  ON checklist_items FOR SELECT
  TO authenticated
  USING (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ));

CREATE POLICY "System can manage checklist items"
  ON checklist_items FOR ALL
  TO authenticated
  USING (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ))
  WITH CHECK (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ));

-- Inventory items policies
CREATE POLICY "Household members can manage inventory items"
  ON inventory_items FOR ALL
  TO authenticated
  USING (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ))
  WITH CHECK (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ));

-- Donut status policies
CREATE POLICY "Household members can view donut status"
  ON donut_status FOR SELECT
  TO authenticated
  USING (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ));

CREATE POLICY "System can manage donut status"
  ON donut_status FOR ALL
  TO authenticated
  USING (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ))
  WITH CHECK (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ));

-- NBA actions policies
CREATE POLICY "Household members can view NBA actions"
  ON nba_actions FOR SELECT
  TO authenticated
  USING (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ));

CREATE POLICY "System can manage NBA actions"
  ON nba_actions FOR ALL
  TO authenticated
  USING (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ))
  WITH CHECK (household_id IN (
    SELECT m.household_id FROM memberships m
    JOIN accounts a ON m.account_id = a.id
    WHERE a.user_id = auth.uid()
  ));

-- Invites policies
CREATE POLICY "Users can view invites they created"
  ON invites FOR SELECT
  TO authenticated
  USING (created_by IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can create invites for their households"
  ON invites FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by IN (SELECT id FROM accounts WHERE user_id = auth.uid()) AND
    household_id IN (
      SELECT m.household_id FROM memberships m
      JOIN accounts a ON m.account_id = a.id
      WHERE a.user_id = auth.uid() AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Anyone can view valid invites by token"
  ON invites FOR SELECT
  TO authenticated
  USING (used_at IS NULL AND expires_at > now());

CREATE POLICY "Users can use invites"
  ON invites FOR UPDATE
  TO authenticated
  USING (used_at IS NULL AND expires_at > now());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_account_id ON memberships(account_id);
CREATE INDEX IF NOT EXISTS idx_memberships_household_id ON memberships(household_id);
CREATE INDEX IF NOT EXISTS idx_members_household_id ON members(household_id);
CREATE INDEX IF NOT EXISTS idx_pets_household_id ON pets(household_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_household_id ON checklist_items(household_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_household_id ON inventory_items(household_id);
CREATE INDEX IF NOT EXISTS idx_donut_status_household_id ON donut_status(household_id);
CREATE INDEX IF NOT EXISTS idx_nba_actions_household_id ON nba_actions(household_id);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_household_id ON invites(household_id);