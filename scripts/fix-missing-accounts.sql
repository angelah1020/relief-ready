-- Script to create missing account entries for users who have memberships but no account
-- Run this in your Supabase SQL editor

-- First, let's see what users have memberships but no accounts
SELECT DISTINCT m.account_id, u.email
FROM memberships m
LEFT JOIN accounts a ON m.account_id = a.user_id
LEFT JOIN auth.users u ON m.account_id = u.id
WHERE a.id IS NULL;

-- Create missing account entries
-- Replace 'YOUR_USER_ID' with your actual auth user ID
-- You can find this in the auth.users table or from the console logs

INSERT INTO accounts (user_id, display_name, created_at, updated_at)
SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'display_name', u.email) as display_name,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
WHERE u.id IN (
    SELECT DISTINCT m.account_id
    FROM memberships m
    LEFT JOIN accounts a ON m.account_id = a.user_id
    WHERE a.id IS NULL
)
ON CONFLICT (user_id) DO NOTHING;
