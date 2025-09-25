-- Check current table structure and create migration accordingly
DO $$
BEGIN
  -- Check if prompts table exists, if so rename it to prompt_versions
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prompts' AND table_schema = 'public') THEN
    ALTER TABLE public.prompts RENAME TO prompt_versions;
  END IF;
  
  -- Check if prompt_versions exists, if not skip migration
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prompt_versions' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'No prompt_versions table found - migration may have already run or database is in unexpected state';
  END IF;
END $$;

-- Add prompt_id column if it doesn't exist
ALTER TABLE public.prompt_versions 
ADD COLUMN IF NOT EXISTS prompt_id UUID;

-- Create new prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID NULL,
  current_version_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parent prompt records
INSERT INTO public.prompts (id, user_id, folder_id, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  pv.user_id,
  pv.folder_id,
  MIN(pv.created_at) as created_at,
  MAX(pv.updated_at) as updated_at
FROM public.prompt_versions pv
WHERE pv.prompt_id IS NULL  -- Only process records without prompt_id
GROUP BY pv.user_id, pv.folder_id
ON CONFLICT (id) DO NOTHING;

-- Update prompt_versions with prompt_id references
UPDATE public.prompt_versions 
SET prompt_id = (
  SELECT p.id 
  FROM public.prompts p 
  WHERE p.user_id = prompt_versions.user_id 
    AND (
      (p.folder_id IS NULL AND prompt_versions.folder_id IS NULL) OR
      (p.folder_id = prompt_versions.folder_id)
    )
  LIMIT 1
)
WHERE prompt_id IS NULL;

-- Update current_version_id in prompts
UPDATE public.prompts 
SET current_version_id = (
  SELECT pv.id 
  FROM public.prompt_versions pv 
  WHERE pv.prompt_id = prompts.id
  ORDER BY pv.version DESC, pv.created_at DESC
  LIMIT 1
)
WHERE current_version_id IS NULL;

-- Make prompt_id NOT NULL
ALTER TABLE public.prompt_versions 
ALTER COLUMN prompt_id SET NOT NULL;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_prompt_versions_prompt_id'
  ) THEN
    ALTER TABLE public.prompt_versions 
    ADD CONSTRAINT fk_prompt_versions_prompt_id 
    FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_prompts_current_version_id'
  ) THEN
    ALTER TABLE public.prompts 
    ADD CONSTRAINT fk_prompts_current_version_id 
    FOREIGN KEY (current_version_id) REFERENCES public.prompt_versions(id);
  END IF;
END $$;

-- Enable RLS on prompts table
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prompts table
DROP POLICY IF EXISTS "Users can view their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can create their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.prompts;

CREATE POLICY "Users can view their own prompts" 
ON public.prompts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prompts" 
ON public.prompts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts" 
ON public.prompts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts" 
ON public.prompts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update RLS policies for prompt_versions
DROP POLICY IF EXISTS "Users can view their own prompts" ON public.prompt_versions;
DROP POLICY IF EXISTS "Users can create their own prompts" ON public.prompt_versions;
DROP POLICY IF EXISTS "Users can update their own prompts" ON public.prompt_versions;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.prompt_versions;

CREATE POLICY "Users can view their own prompt versions" 
ON public.prompt_versions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.prompts p 
  WHERE p.id = prompt_versions.prompt_id AND p.user_id = auth.uid()
));

CREATE POLICY "Users can create their own prompt versions" 
ON public.prompt_versions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.prompts p 
  WHERE p.id = prompt_versions.prompt_id AND p.user_id = auth.uid()
));

CREATE POLICY "Users can update their own prompt versions" 
ON public.prompt_versions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.prompts p 
  WHERE p.id = prompt_versions.prompt_id AND p.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own prompt versions" 
ON public.prompt_versions 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.prompts p 
  WHERE p.id = prompt_versions.prompt_id AND p.user_id = auth.uid()
));

-- Add trigger for updated_at on prompts table
DROP TRIGGER IF EXISTS update_prompts_updated_at ON public.prompts;
CREATE TRIGGER update_prompts_updated_at
BEFORE UPDATE ON public.prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();