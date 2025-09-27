/*
# Disable Row Level Security

This migration disables row-level security on all tables to allow unrestricted access during development.
*/

-- Disable Row Level Security on all tables
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE households DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE pets DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE donut_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE nba_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE invites DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own account" ON accounts;
DROP POLICY IF EXISTS "Users can insert own account" ON accounts;
DROP POLICY IF EXISTS "Users can update own account" ON accounts;

DROP POLICY IF EXISTS "Users can view their memberships" ON memberships;
DROP POLICY IF EXISTS "Users can insert their memberships" ON memberships;

DROP POLICY IF EXISTS "Household members can view household" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Household owners can update household" ON households;

DROP POLICY IF EXISTS "Household members can view members" ON members;
DROP POLICY IF EXISTS "Household members can manage members" ON members;

DROP POLICY IF EXISTS "Household members can view pets" ON pets;
DROP POLICY IF EXISTS "Household members can manage pets" ON pets;

DROP POLICY IF EXISTS "Household members can view checklist items" ON checklist_items;
DROP POLICY IF EXISTS "System can manage checklist items" ON checklist_items;

DROP POLICY IF EXISTS "Household members can manage inventory items" ON inventory_items;

DROP POLICY IF EXISTS "Household members can view donut status" ON donut_status;
DROP POLICY IF EXISTS "System can manage donut status" ON donut_status;

DROP POLICY IF EXISTS "Household members can view NBA actions" ON nba_actions;
DROP POLICY IF EXISTS "System can manage NBA actions" ON nba_actions;

DROP POLICY IF EXISTS "Users can view invites they created" ON invites;
DROP POLICY IF EXISTS "Users can create invites for their households" ON invites;
DROP POLICY IF EXISTS "Anyone can view valid invites by token" ON invites;
DROP POLICY IF EXISTS "Users can use invites" ON invites;
