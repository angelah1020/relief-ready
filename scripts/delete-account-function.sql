-- Create a database function to handle complete account deletion
-- This ensures data integrity and proper cleanup order

CREATE OR REPLACE FUNCTION delete_user_account(target_user_id uuid)
RETURNS json AS $$
DECLARE
  account_record accounts%ROWTYPE;
  result json;
BEGIN
  -- Get the account record
  SELECT * INTO account_record FROM accounts WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Account not found'
    );
  END IF;

  -- Step 1: Delete memberships (removes user from all households)
  DELETE FROM memberships WHERE account_id = account_record.id;

  -- Step 2: Delete chat messages
  DELETE FROM chat_messages WHERE user_id = target_user_id;

  -- Step 3: Unclaim members (set claimed_by to null)
  UPDATE members SET claimed_by = NULL WHERE claimed_by = target_user_id;

  -- Step 4: Remove creator references from members
  UPDATE members SET created_by = NULL WHERE created_by = target_user_id;

  -- Step 5: Remove creator references from households (don't delete households)
  UPDATE households SET created_by = NULL WHERE created_by = target_user_id;

  -- Step 6: Delete the account record
  DELETE FROM accounts WHERE id = account_record.id;

  RETURN json_build_object(
    'success', true,
    'message', 'Account data deleted successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(uuid) TO authenticated;
