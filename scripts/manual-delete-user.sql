-- Manual script to delete a specific user (11@gmail.com)
-- Run this in Supabase SQL editor with admin privileges

-- 1. First, find the user details
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = '11@gmail.com';

-- 2. Find their account record
SELECT 
  a.id as account_id,
  a.user_id,
  a.email,
  a.display_name
FROM accounts a
JOIN auth.users u ON a.user_id = u.id
WHERE u.email = '11@gmail.com';

-- 3. Check their memberships
SELECT 
  m.id as membership_id,
  h.name as household_name,
  h.id as household_id,
  m.role
FROM memberships m
JOIN accounts a ON m.account_id = a.id
JOIN auth.users u ON a.user_id = u.id
JOIN households h ON m.household_id = h.id
WHERE u.email = '11@gmail.com';

-- 4. Manual deletion process (run these one by one)

-- Step 1: Find households where user is the only member (these will be deleted)
WITH user_households AS (
  SELECT DISTINCT m.household_id
  FROM memberships m
  JOIN accounts a ON m.account_id = a.id
  JOIN auth.users u ON a.user_id = u.id
  WHERE u.email = '11@gmail.com'
),
household_member_counts AS (
  SELECT 
    uh.household_id,
    COUNT(m.id) as member_count
  FROM user_households uh
  LEFT JOIN memberships m ON uh.household_id = m.household_id
  GROUP BY uh.household_id
)
SELECT 
  h.id,
  h.name,
  hmc.member_count,
  CASE WHEN hmc.member_count = 1 THEN 'WILL BE DELETED' ELSE 'USER WILL BE REMOVED' END as action
FROM household_member_counts hmc
JOIN households h ON hmc.household_id = h.id;

-- Step 2: Delete household data for households where user is the only member
-- (Replace the household IDs below with the ones marked 'WILL BE DELETED' from step 1)

-- Example for household IDs that will be deleted (update these with actual IDs):
-- DELETE FROM checklist_items WHERE household_id IN ('household-id-1', 'household-id-2');
-- DELETE FROM inventory_items WHERE household_id IN ('household-id-1', 'household-id-2');
-- DELETE FROM members WHERE household_id IN ('household-id-1', 'household-id-2');
-- DELETE FROM pets WHERE household_id IN ('household-id-1', 'household-id-2');
-- DELETE FROM emergency_contacts WHERE household_id IN ('household-id-1', 'household-id-2');
-- DELETE FROM hazard_configs WHERE household_id IN ('household-id-1', 'household-id-2');
-- DELETE FROM donut_status WHERE household_id IN ('household-id-1', 'household-id-2');

-- Step 3: Delete memberships
DELETE FROM memberships 
WHERE account_id IN (
  SELECT a.id 
  FROM accounts a
  JOIN auth.users u ON a.user_id = u.id
  WHERE u.email = '11@gmail.com'
);

-- Step 4: Delete the empty households (update with actual IDs from step 1)
-- DELETE FROM households WHERE id IN ('household-id-1', 'household-id-2');

-- Step 5: Delete chat messages
DELETE FROM chat_messages 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = '11@gmail.com'
);

-- Step 6: Unclaim members
UPDATE members 
SET claimed_by = NULL 
WHERE claimed_by IN (
  SELECT id FROM auth.users WHERE email = '11@gmail.com'
);

-- Step 7: Remove creator references
UPDATE members 
SET created_by = NULL 
WHERE created_by IN (
  SELECT id FROM auth.users WHERE email = '11@gmail.com'
);

UPDATE households 
SET created_by = NULL 
WHERE created_by IN (
  SELECT id FROM auth.users WHERE email = '11@gmail.com'
);

-- Step 8: Delete account record
DELETE FROM accounts 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = '11@gmail.com'
);

-- Step 9: Delete auth user (ADMIN ONLY - requires RLS bypass)
-- This must be done in the Supabase dashboard with admin privileges
DELETE FROM auth.users WHERE email = '11@gmail.com';

-- Verification: Check that user is completely removed
SELECT 'auth.users' as table_name, count(*) as remaining_count
FROM auth.users WHERE email = '11@gmail.com'
UNION ALL
SELECT 'accounts' as table_name, count(*) as remaining_count
FROM accounts a
JOIN auth.users u ON a.user_id = u.id
WHERE u.email = '11@gmail.com'
UNION ALL
SELECT 'memberships' as table_name, count(*) as remaining_count
FROM memberships m
JOIN accounts a ON m.account_id = a.id
JOIN auth.users u ON a.user_id = u.id
WHERE u.email = '11@gmail.com';
