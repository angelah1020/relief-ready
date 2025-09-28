-- Create an edge function or RPC to handle auth user deletion
-- This requires admin privileges and should be called from a secure context

CREATE OR REPLACE FUNCTION delete_auth_user_rpc(target_user_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- This function would need to be implemented with proper admin privileges
  -- For now, we'll return a message indicating manual deletion is needed
  
  RETURN json_build_object(
    'success', false,
    'error', 'Auth user deletion requires admin privileges. Please contact support or use Supabase dashboard.',
    'user_id', target_user_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Create a table to track users pending deletion
CREATE TABLE IF NOT EXISTS user_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  requested_at timestamp with time zone DEFAULT now(),
  processed boolean DEFAULT false,
  processed_at timestamp with time zone
);

-- Function to request user deletion (safer approach)
CREATE OR REPLACE FUNCTION request_user_deletion(target_user_id uuid, user_email text)
RETURNS json AS $$
BEGIN
  -- Insert deletion request
  INSERT INTO user_deletion_requests (user_id, email)
  VALUES (target_user_id, user_email)
  ON CONFLICT (user_id) DO UPDATE SET
    requested_at = now(),
    processed = false,
    processed_at = null;

  RETURN json_build_object(
    'success', true,
    'message', 'Deletion request submitted. Your account will be deleted shortly.'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION request_user_deletion(uuid, text) TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_deletion_requests TO authenticated;
