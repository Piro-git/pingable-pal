-- Update the update_overdue_checks function to remove Authorization headers
CREATE OR REPLACE FUNCTION public.update_overdue_checks()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  check_record RECORD;
  user_record RECORD;
  request_id bigint;
BEGIN
  -- Find checks that are 'up' but overdue (including grace period)
  FOR check_record IN 
    SELECT 
      c.id, c.name, c.user_id, c.last_pinged_at, 
      c.interval_minutes, c.grace_period_minutes, c.slack_webhook_url
    FROM checks c
    WHERE c.status = 'up' 
      AND c.last_pinged_at IS NOT NULL 
      AND now() > (c.last_pinged_at + ((c.interval_minutes + COALESCE(c.grace_period_minutes, 0)) * interval '1 minute'))
  LOOP
    -- Mark as down
    UPDATE checks SET status = 'down' WHERE id = check_record.id;
    
    -- Get user email
    SELECT email INTO user_record FROM auth.users WHERE id = check_record.user_id;
    
    -- Send email notification using pg_net without auth (function is public)
    IF user_record.email IS NOT NULL THEN
      BEGIN
        SELECT net.http_post(
          url := 'https://mrtovhqequmhdgccwffs.supabase.co/functions/v1/send-failure-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object(
            'check_id', check_record.id::text,
            'check_name', check_record.name,
            'user_email', user_record.email,
            'last_pinged_at', check_record.last_pinged_at::text,
            'interval_minutes', check_record.interval_minutes,
            'grace_period_minutes', check_record.grace_period_minutes
          )
        ) INTO request_id;
        
        RAISE NOTICE 'Email notification queued for check % (request_id: %)', check_record.name, request_id;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to send email for check %: %', check_record.name, SQLERRM;
      END;
    END IF;
    
    -- Send Slack notification if configured
    IF check_record.slack_webhook_url IS NOT NULL THEN
      BEGIN
        SELECT net.http_post(
          url := 'https://mrtovhqequmhdgccwffs.supabase.co/functions/v1/send-slack-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object(
            'check_id', check_record.id::text,
            'check_name', check_record.name,
            'slack_webhook_url', check_record.slack_webhook_url,
            'status', 'down',
            'last_pinged_at', check_record.last_pinged_at::text,
            'interval_minutes', check_record.interval_minutes,
            'grace_period_minutes', check_record.grace_period_minutes
          )
        ) INTO request_id;
        
        RAISE NOTICE 'Slack notification queued for check % (request_id: %)', check_record.name, request_id;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to send Slack notification for check %: %', check_record.name, SQLERRM;
      END;
    END IF;
  END LOOP;
END;
$function$;