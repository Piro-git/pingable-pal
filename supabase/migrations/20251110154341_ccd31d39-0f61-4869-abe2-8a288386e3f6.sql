-- Drop the old constraint that only allowed /services/
ALTER TABLE checks
DROP CONSTRAINT IF EXISTS valid_slack_webhook;

-- Add new constraint that supports both /services/ and /triggers/
ALTER TABLE checks
ADD CONSTRAINT valid_slack_webhook CHECK (
  slack_webhook_url IS NULL OR 
  slack_webhook_url ~* '^https://hooks\.slack\.com/(services|triggers)/[A-Z0-9]+/[A-Z0-9]+/[A-Za-z0-9]+$'
);