-- Admin script to process user deletion requests
-- Run this periodically in Supabase dashboard or via cron job

-- View pending deletion requests
SELECT 
  id,
  user_id,
  email,
  requested_at,
  processed
FROM user_deletion_requests 
WHERE processed = false
ORDER BY requested_at ASC;

-- To manually delete auth users (run in Supabase dashboard with admin privileges):
-- 1. Get the user IDs from above query
-- 2. For each user_id, run:

/*
-- Example for a specific user (replace USER_ID_HERE with actual UUID):
SELECT auth.users.email 
FROM auth.users 
WHERE id = 'USER_ID_HERE';

-- Delete the auth user (admin only):
DELETE FROM auth.users WHERE id = 'USER_ID_HERE';

-- Mark as processed:
UPDATE user_deletion_requests 
SET processed = true, processed_at = now() 
WHERE user_id = 'USER_ID_HERE';
*/

-- Bulk processing function (admin only - requires RLS bypass):
CREATE OR REPLACE FUNCTION process_deletion_requests()
RETURNS json AS $$
DECLARE
  request_record RECORD;
  processed_count integer := 0;
  error_count integer := 0;
BEGIN
  -- Loop through unprocessed requests
  FOR request_record IN 
    SELECT * FROM user_deletion_requests 
    WHERE processed = false 
    ORDER BY requested_at ASC
    LIMIT 10 -- Process in batches
  LOOP
    BEGIN
      -- Delete from auth.users (requires admin privileges)
      DELETE FROM auth.users WHERE id = request_record.user_id;
      
      -- Mark as processed
      UPDATE user_deletion_requests 
      SET processed = true, processed_at = now() 
      WHERE id = request_record.id;
      
      processed_count := processed_count + 1;
      
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        -- Log the error but continue processing
        RAISE NOTICE 'Error processing deletion request for user %: %', 
          request_record.user_id, SQLERRM;
    END;
  END LOOP;
  
  RETURN json_build_object(
    'processed', processed_count,
    'errors', error_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old processed requests (optional - run monthly)
DELETE FROM user_deletion_requests 
WHERE processed = true 
AND processed_at < now() - interval '30 days';
