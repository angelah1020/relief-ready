-- Add email column to accounts table and set up proper account creation

-- 1. Add email column to accounts table
ALTER TABLE accounts ADD COLUMN email text;

-- 2. Create index on email for performance
CREATE INDEX idx_accounts_email ON accounts(email);

-- 3. Update existing accounts with email from auth.users
UPDATE accounts 
SET email = auth_users.email
FROM auth.users auth_users
WHERE accounts.user_id = auth_users.id
AND accounts.email IS NULL;

-- 4. Make email NOT NULL after populating existing records
ALTER TABLE accounts ALTER COLUMN email SET NOT NULL;

-- 5. Add unique constraint on email
ALTER TABLE accounts ADD CONSTRAINT accounts_email_unique UNIQUE (email);

-- 6. Create a function to automatically create account when user signs up
CREATE OR REPLACE FUNCTION create_account_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (user_id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to automatically create account on user signup
DROP TRIGGER IF EXISTS create_account_trigger ON auth.users;
CREATE TRIGGER create_account_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_account_on_signup();
