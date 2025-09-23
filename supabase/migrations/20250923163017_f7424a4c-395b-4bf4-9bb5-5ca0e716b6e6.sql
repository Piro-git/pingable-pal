-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to update overdue checks
CREATE OR REPLACE FUNCTION update_overdue_checks()
RETURNS void AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update checks that are currently 'up' but are overdue
  UPDATE checks 
  SET status = 'down'
  WHERE status = 'up' 
    AND last_pinged_at IS NOT NULL 
    AND now() > (last_pinged_at + (interval_minutes * interval '1 minute'));
    
  -- Log how many checks were updated
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % overdue checks to down status', updated_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run every minute
SELECT cron.schedule(
  'update-overdue-checks',
  '* * * * *', -- every minute
  'SELECT update_overdue_checks();'
);