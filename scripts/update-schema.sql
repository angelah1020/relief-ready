-- Option 2: Update schema to reference auth.users directly
-- This removes the dependency on the accounts table for basic functionality

-- 1. Add a new column to memberships that references auth.users directly
ALTER TABLE memberships ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- 2. Populate the new column with existing data
UPDATE memberships 
SET user_id = account_id 
WHERE user_id IS NULL;

-- 3. Make user_id NOT NULL after populating
ALTER TABLE memberships ALTER COLUMN user_id SET NOT NULL;

-- 4. Create index for performance
CREATE INDEX idx_memberships_user_id ON memberships(user_id);

-- 5. Optional: You can keep account_id for backwards compatibility
-- or drop it after updating your code to use user_id

-- To use this approach, you'd update your HouseholdContext to query:
-- SELECT * FROM memberships WHERE user_id = $1
