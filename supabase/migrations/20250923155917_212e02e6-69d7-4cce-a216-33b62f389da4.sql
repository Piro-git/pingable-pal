-- Create checks table for monitoring heartbeat URLs
CREATE TABLE public.checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'up' CHECK (status IN ('up', 'down')),
  interval_minutes INTEGER NOT NULL,
  grace_period_minutes INTEGER DEFAULT 60,
  heartbeat_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  last_pinged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own checks" 
ON public.checks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checks" 
ON public.checks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checks" 
ON public.checks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checks" 
ON public.checks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_checks_updated_at
BEFORE UPDATE ON public.checks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();