-- Fix the function search path security issue
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
$$ LANGUAGE plpgsql SET search_path = public;