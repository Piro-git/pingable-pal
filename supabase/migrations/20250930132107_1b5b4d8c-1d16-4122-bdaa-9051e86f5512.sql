-- Add color column to folders table
ALTER TABLE public.folders 
ADD COLUMN color TEXT DEFAULT '#3B82F6';

-- Add color column to checks table
ALTER TABLE public.checks 
ADD COLUMN color TEXT DEFAULT '#3B82F6';