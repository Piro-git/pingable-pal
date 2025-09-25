-- Add variables column to prompts table to store detected variable names
ALTER TABLE public.prompts ADD COLUMN variables JSONB DEFAULT '[]'::jsonb;