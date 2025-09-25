-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- Create helper function to check if user has required role
CREATE OR REPLACE FUNCTION public.has_role_access(_user_id uuid, _required_roles text[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id AND role = ANY(_required_roles)
  );
$$;

-- Update RLS policies for prompts table
DROP POLICY IF EXISTS "Users can view their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can create their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.prompts;

-- New role-based policies for prompts
CREATE POLICY "All authenticated users can view prompts" 
ON public.prompts 
FOR SELECT 
TO authenticated
USING (
  public.has_role_access(auth.uid(), ARRAY['admin', 'editor', 'viewer'])
);

CREATE POLICY "Admins and editors can create prompts" 
ON public.prompts 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role_access(auth.uid(), ARRAY['admin', 'editor'])
  AND auth.uid() = user_id
);

CREATE POLICY "Prompt owners and admins/editors can update prompts" 
ON public.prompts 
FOR UPDATE 
TO authenticated
USING (
  (auth.uid() = user_id AND public.has_role_access(auth.uid(), ARRAY['admin', 'editor']))
  OR public.has_role_access(auth.uid(), ARRAY['admin'])
);

CREATE POLICY "Only admins can delete prompts" 
ON public.prompts 
FOR DELETE 
TO authenticated
USING (
  public.has_role_access(auth.uid(), ARRAY['admin'])
);

-- Update RLS policies for prompt_versions table
DROP POLICY IF EXISTS "Users can view their own prompt versions" ON public.prompt_versions;
DROP POLICY IF EXISTS "Users can create their own prompt versions" ON public.prompt_versions;
DROP POLICY IF EXISTS "Users can update their own prompt versions" ON public.prompt_versions;
DROP POLICY IF EXISTS "Users can delete their own prompt versions" ON public.prompt_versions;

CREATE POLICY "All authenticated users can view prompt versions" 
ON public.prompt_versions 
FOR SELECT 
TO authenticated
USING (
  public.has_role_access(auth.uid(), ARRAY['admin', 'editor', 'viewer'])
  AND EXISTS (
    SELECT 1 FROM public.prompts p 
    WHERE p.id = prompt_versions.prompt_id
  )
);

CREATE POLICY "Admins and editors can create prompt versions" 
ON public.prompt_versions 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role_access(auth.uid(), ARRAY['admin', 'editor'])
  AND EXISTS (
    SELECT 1 FROM public.prompts p 
    WHERE p.id = prompt_versions.prompt_id 
    AND (p.user_id = auth.uid() OR public.has_role_access(auth.uid(), ARRAY['admin']))
  )
);

CREATE POLICY "Admins and editors can update prompt versions" 
ON public.prompt_versions 
FOR UPDATE 
TO authenticated
USING (
  public.has_role_access(auth.uid(), ARRAY['admin', 'editor'])
  AND EXISTS (
    SELECT 1 FROM public.prompts p 
    WHERE p.id = prompt_versions.prompt_id 
    AND (p.user_id = auth.uid() OR public.has_role_access(auth.uid(), ARRAY['admin']))
  )
);

CREATE POLICY "Only admins can delete prompt versions" 
ON public.prompt_versions 
FOR DELETE 
TO authenticated
USING (
  public.has_role_access(auth.uid(), ARRAY['admin'])
);

-- Update RLS policies for folders table
DROP POLICY IF EXISTS "Users can view their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can create their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;

CREATE POLICY "All authenticated users can view folders" 
ON public.folders 
FOR SELECT 
TO authenticated
USING (
  public.has_role_access(auth.uid(), ARRAY['admin', 'editor', 'viewer'])
);

CREATE POLICY "Admins and editors can create folders" 
ON public.folders 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role_access(auth.uid(), ARRAY['admin', 'editor'])
  AND auth.uid() = user_id
);

CREATE POLICY "Folder owners and admins can update folders" 
ON public.folders 
FOR UPDATE 
TO authenticated
USING (
  (auth.uid() = user_id AND public.has_role_access(auth.uid(), ARRAY['admin', 'editor']))
  OR public.has_role_access(auth.uid(), ARRAY['admin'])
);

CREATE POLICY "Only admins can delete folders" 
ON public.folders 
FOR DELETE 
TO authenticated
USING (
  public.has_role_access(auth.uid(), ARRAY['admin'])
);

-- Update RLS policies for tags table
DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can create their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;

CREATE POLICY "All authenticated users can view tags" 
ON public.tags 
FOR SELECT 
TO authenticated
USING (
  public.has_role_access(auth.uid(), ARRAY['admin', 'editor', 'viewer'])
);

CREATE POLICY "Admins and editors can create tags" 
ON public.tags 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role_access(auth.uid(), ARRAY['admin', 'editor'])
  AND auth.uid() = user_id
);

CREATE POLICY "Tag owners and admins can update tags" 
ON public.tags 
FOR UPDATE 
TO authenticated
USING (
  (auth.uid() = user_id AND public.has_role_access(auth.uid(), ARRAY['admin', 'editor']))
  OR public.has_role_access(auth.uid(), ARRAY['admin'])
);

CREATE POLICY "Only admins can delete tags" 
ON public.tags 
FOR DELETE 
TO authenticated
USING (
  public.has_role_access(auth.uid(), ARRAY['admin'])
);