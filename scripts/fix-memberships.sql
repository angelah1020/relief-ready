-- Script to fix existing memberships that reference user_id directly instead of account_id
-- This will update memberships to use the proper account_id from the accounts table

-- First, let's see what memberships exist and their current account_id values
SELECT 
  m.id as membership_id,
  m.account_id as current_account_id,
  a.id as correct_account_id,
  a.user_id,
  a.email,
  h.name as household_name
FROM memberships m
LEFT JOIN accounts a ON m.account_id = a.user_id  -- This shows if account_id is actually user_id
LEFT JOIN households h ON m.household_id = h.id
ORDER BY a.email;

-- Update memberships to use correct account_id
-- This updates memberships where account_id is actually the user_id
UPDATE memberships 
SET account_id = accounts.id
FROM accounts 
WHERE memberships.account_id = accounts.user_id
AND memberships.account_id != accounts.id;

-- Verify the fix
SELECT 
  m.id as membership_id,
  m.account_id,
  a.id as account_id_check,
  a.user_id,
  a.email,
  h.name as household_name
FROM memberships m
JOIN accounts a ON m.account_id = a.id  -- Should now properly join
JOIN households h ON m.household_id = h.id
ORDER BY a.email;

-- Clean up any duplicate memberships that might have been created
WITH duplicate_memberships AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY account_id, household_id ORDER BY created_at ASC) as rn
  FROM memberships
)
DELETE FROM memberships 
WHERE id IN (
  SELECT id FROM duplicate_memberships WHERE rn > 1
);
