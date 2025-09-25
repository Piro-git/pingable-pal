-- Fix prompt_tags RLS policies to work with new database structure

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view prompt tags for their own prompts" ON public.prompt_tags;
DROP POLICY IF EXISTS "Users can create prompt tags for their own prompts" ON public.prompt_tags;
DROP POLICY IF EXISTS "Users can delete prompt tags for their own prompts" ON public.prompt_tags;

-- Create corrected policies that check prompt ownership via the prompts table
CREATE POLICY "Users can view prompt tags for their own prompts" 
ON public.prompt_tags 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.prompts p 
  WHERE p.id = prompt_tags.prompt_id AND p.user_id = auth.uid()
));

CREATE POLICY "Users can create prompt tags for their own prompts" 
ON public.prompt_tags 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.prompts p 
  WHERE p.id = prompt_tags.prompt_id AND p.user_id = auth.uid()
));

CREATE POLICY "Users can delete prompt tags for their own prompts" 
ON public.prompt_tags 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.prompts p 
  WHERE p.id = prompt_tags.prompt_id AND p.user_id = auth.uid()
));

-- Also ensure we can update prompt_tags (though not typically needed)
CREATE POLICY "Users can update prompt tags for their own prompts" 
ON public.prompt_tags 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.prompts p 
  WHERE p.id = prompt_tags.prompt_id AND p.user_id = auth.uid()
));