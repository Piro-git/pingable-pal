-- Make category_id nullable since we're transitioning to folders
ALTER TABLE public.prompts ALTER COLUMN category_id DROP NOT NULL;