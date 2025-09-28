-- Simple script to delete auth user (run in Supabase dashboard)
-- This requires admin privileges and should be run after the app deletion

-- 1. Find the user
SELECT id, email, created_at FROM auth.users WHERE email = '11@gmail.com';

-- 2. Delete the auth user (ADMIN ONLY)
-- This bypasses RLS and requires admin privileges in Supabase dashboard
DELETE FROM auth.users WHERE email = '11@gmail.com';

-- 3. Verify deletion
SELECT count(*) as remaining_users FROM auth.users WHERE email = '11@gmail.com';

-- Alternative: If direct deletion doesn't work, you can also use the Supabase dashboard:
-- 1. Go to Authentication > Users
-- 2. Find the user with email '11@gmail.com'  
-- 3. Click the three dots menu
-- 4. Select "Delete user"
