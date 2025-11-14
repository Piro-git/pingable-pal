-- Change default grace period from 60 to 5 minutes
ALTER TABLE checks 
ALTER COLUMN grace_period_minutes SET DEFAULT 5;

-- Update existing checks to 2 minutes for immediate testing
UPDATE checks 
SET grace_period_minutes = 2
WHERE user_id IN (SELECT id FROM auth.users);