-- Add join code column to households
ALTER TABLE households ADD COLUMN join_code text UNIQUE;

-- Add function to generate random join code
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate a random 6-character alphanumeric code
    code := upper(substring(md5(random()::text), 1, 6));
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM households WHERE join_code = code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Create trigger function first
CREATE OR REPLACE FUNCTION trigger_set_join_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.join_code := generate_join_code();
  RETURN NEW;
END;
$$;

-- Then create the trigger that uses it
CREATE TRIGGER set_join_code
  BEFORE INSERT ON households
  FOR EACH ROW
  WHEN (NEW.join_code IS NULL)
  EXECUTE FUNCTION trigger_set_join_code();

-- Set initial join codes for existing households
UPDATE households
SET join_code = generate_join_code()
WHERE join_code IS NULL;