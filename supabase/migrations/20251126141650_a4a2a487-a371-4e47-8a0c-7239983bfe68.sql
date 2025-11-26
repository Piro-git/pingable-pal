-- Add foreign key constraints to prompt_tags table
ALTER TABLE public.prompt_tags
ADD CONSTRAINT prompt_tags_prompt_id_fkey 
FOREIGN KEY (prompt_id) 
REFERENCES public.prompts(id) 
ON DELETE CASCADE;

ALTER TABLE public.prompt_tags
ADD CONSTRAINT prompt_tags_tag_id_fkey 
FOREIGN KEY (tag_id) 
REFERENCES public.tags(id) 
ON DELETE CASCADE;