-- Database cleanup script
-- Run these queries to clean up your database

-- 1. Remove duplicate households (keep the oldest one for each name/zip combination)
WITH duplicate_households AS (
  SELECT 
    id,
    name,
    zip_code,
    ROW_NUMBER() OVER (PARTITION BY name, zip_code ORDER BY created_at ASC) as rn
  FROM households
)
DELETE FROM households 
WHERE id IN (
  SELECT id FROM duplicate_households WHERE rn > 1
);

-- 2. Remove duplicate memberships (keep the oldest one for each user/household combination)
WITH duplicate_memberships AS (
  SELECT 
    id,
    account_id,
    household_id,
    ROW_NUMBER() OVER (PARTITION BY account_id, household_id ORDER BY created_at ASC) as rn
  FROM memberships
)
DELETE FROM memberships 
WHERE id IN (
  SELECT id FROM duplicate_memberships WHERE rn > 1
);

-- 3. Clean up orphaned records (optional - be careful with these)

-- Find memberships with no corresponding household
SELECT m.id, m.account_id, m.household_id 
FROM memberships m
LEFT JOIN households h ON m.household_id = h.id
WHERE h.id IS NULL;

-- Find memberships with no corresponding account
SELECT m.id, m.account_id, m.household_id 
FROM memberships m
LEFT JOIN accounts a ON m.account_id = a.id
WHERE a.id IS NULL;

-- Find households with no members (might want to keep these)
SELECT h.id, h.name, h.created_at
FROM households h
LEFT JOIN memberships m ON h.id = m.household_id
WHERE m.id IS NULL
ORDER BY h.created_at DESC;

-- 4. Update household names to be more descriptive (optional)
-- You have several households with the same name "My Household"
SELECT id, name, zip_code, created_at 
FROM households 
WHERE name IN ('My Household', 'My Lo', 'My Lol', 'My 1')
ORDER BY created_at;

-- Example: Rename households to be more unique
-- UPDATE households SET name = 'Home - ' || zip_code WHERE name = 'My Household';

-- 5. Clean up old processed deletion requests (if you implemented the deletion system)
DELETE FROM user_deletion_requests 
WHERE processed = true 
AND processed_at < now() - interval '7 days';

-- 6. Verify your data integrity
SELECT 
  'Accounts' as table_name, 
  count(*) as count 
FROM accounts
UNION ALL
SELECT 
  'Households' as table_name, 
  count(*) as count 
FROM households
UNION ALL
SELECT 
  'Memberships' as table_name, 
  count(*) as count 
FROM memberships
UNION ALL
SELECT 
  'Members' as table_name, 
  count(*) as count 
FROM members
UNION ALL
SELECT 
  'Pets' as table_name, 
  count(*) as count 
FROM pets;
