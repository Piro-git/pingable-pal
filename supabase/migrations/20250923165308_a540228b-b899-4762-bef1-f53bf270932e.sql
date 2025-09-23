-- Fix the update_overdue_checks function to properly call the email notification
CREATE OR REPLACE FUNCTION update_overdue_checks()
RETURNS void AS $$
DECLARE
  updated_count INTEGER := 0;
  check_record RECORD;
  user_record RECORD;
  http_response RECORD;
BEGIN
  -- Update checks that are currently 'up' but are overdue and get their details
  FOR check_record IN 
    SELECT c.id, c.name, c.user_id, c.last_pinged_at, c.interval_minutes
    FROM checks c
    WHERE c.status = 'up' 
      AND c.last_pinged_at IS NOT NULL 
      AND now() > (c.last_pinged_at + (c.interval_minutes * interval '1 minute'))
  LOOP
    -- Update the check status to 'down'
    UPDATE checks 
    SET status = 'down'
    WHERE id = check_record.id;
    
    -- Get user email from auth.users
    SELECT email INTO user_record 
    FROM auth.users 
    WHERE id = check_record.user_id;
    
    -- Send email notification via Edge Function
    IF user_record.email IS NOT NULL THEN
      BEGIN
        SELECT * INTO http_response
        FROM net.http_post(
          url := 'https://mrtovhqequmhdgccwffs.supabase.co/functions/v1/send-failure-email',
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := json_build_object(
            'check_id', check_record.id::text,
            'check_name', check_record.name,
            'user_email', user_record.email
          )::jsonb
        );
        
        RAISE NOTICE 'Sent failure notification for check % (%) to % - Status: %', 
          check_record.name, check_record.id, user_record.email, http_response.status;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to send email notification for check %: %', 
          check_record.name, SQLERRM;
      END;
    END IF;
    
    updated_count := updated_count + 1;
  END LOOP;
    
  -- Log how many checks were updated
  RAISE NOTICE 'Updated % overdue checks to down status', updated_count;
END;
$$ LANGUAGE plpgsql SET search_path = public;