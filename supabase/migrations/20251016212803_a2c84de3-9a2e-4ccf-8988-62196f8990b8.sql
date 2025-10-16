-- Add type column to checks table
ALTER TABLE public.checks 
ADD COLUMN type TEXT NOT NULL DEFAULT 'simple_ping' CHECK (type IN ('simple_ping', 'api_report'));

-- Add index for better query performance
CREATE INDEX idx_checks_type ON public.checks(type);