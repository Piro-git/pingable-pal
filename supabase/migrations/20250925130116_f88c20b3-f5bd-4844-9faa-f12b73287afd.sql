-- Create folders table
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Create policies for folders
CREATE POLICY "Users can view their own folders" 
ON public.folders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" 
ON public.folders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
ON public.folders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
ON public.folders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Enable Row Level Security on tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create policies for tags
CREATE POLICY "Users can view their own tags" 
ON public.tags 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" 
ON public.tags 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" 
ON public.tags 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" 
ON public.tags 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create prompt_tags join table
CREATE TABLE public.prompt_tags (
  prompt_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  PRIMARY KEY (prompt_id, tag_id)
);

-- Enable Row Level Security on prompt_tags
ALTER TABLE public.prompt_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for prompt_tags (users can only manage tags for their own prompts)
CREATE POLICY "Users can view prompt tags for their own prompts" 
ON public.prompt_tags 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.prompts 
    WHERE prompts.id = prompt_tags.prompt_id 
    AND prompts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create prompt tags for their own prompts" 
ON public.prompt_tags 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.prompts 
    WHERE prompts.id = prompt_tags.prompt_id 
    AND prompts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete prompt tags for their own prompts" 
ON public.prompt_tags 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.prompts 
    WHERE prompts.id = prompt_tags.prompt_id 
    AND prompts.user_id = auth.uid()
  )
);

-- Add folder_id column to prompts table
ALTER TABLE public.prompts ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();