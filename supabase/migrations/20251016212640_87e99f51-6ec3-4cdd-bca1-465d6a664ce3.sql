-- Create check_runs table to store detailed automation run results
CREATE TABLE public.check_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id UUID NOT NULL REFERENCES public.checks(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  payload JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries by check_id
CREATE INDEX idx_check_runs_check_id ON public.check_runs(check_id);
CREATE INDEX idx_check_runs_created_at ON public.check_runs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.check_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view runs for their own checks
CREATE POLICY "Users can view their own check runs"
ON public.check_runs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.checks
    WHERE checks.id = check_runs.check_id
    AND checks.user_id = auth.uid()
  )
);

-- RLS Policies: System can insert check runs (via edge function with service role)
CREATE POLICY "Service role can insert check runs"
ON public.check_runs
FOR INSERT
WITH CHECK (true);

-- RLS Policies: Users can delete their own check runs
CREATE POLICY "Users can delete their own check runs"
ON public.check_runs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.checks
    WHERE checks.id = check_runs.check_id
    AND checks.user_id = auth.uid()
  )
);