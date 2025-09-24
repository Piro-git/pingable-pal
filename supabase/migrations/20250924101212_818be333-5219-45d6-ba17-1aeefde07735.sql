-- Create the prompt_categories table
CREATE TABLE public.prompt_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the prompts table
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  category_id UUID NOT NULL REFERENCES public.prompt_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on both tables
ALTER TABLE public.prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prompt_categories
CREATE POLICY "Users can view their own categories" 
ON public.prompt_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" 
ON public.prompt_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
ON public.prompt_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
ON public.prompt_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for prompts
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

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_prompt_categories_updated_at
BEFORE UPDATE ON public.prompt_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
BEFORE UPDATE ON public.prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();