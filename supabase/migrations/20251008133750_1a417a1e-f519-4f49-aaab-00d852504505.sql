-- Phase 1: Create secure user roles system
-- Step 1: Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');

-- Step 2: Create user_roles table with proper RLS
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update the has_role_access function to use the new user_roles table
CREATE OR REPLACE FUNCTION public.has_role_access(_user_id uuid, _required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id 
      AND role::text = ANY(_required_roles)
  );
$$;

-- Step 4: RLS policies for user_roles table
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 5: Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 6: Drop all policies that depend on profiles.role column
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view feedback for prompts they can access" ON public.prompt_feedback;
DROP POLICY IF EXISTS "Admins can manage all invitations" ON public.invitations;

-- Step 7: Remove the role column from profiles
ALTER TABLE public.profiles DROP COLUMN role;

-- Step 8: Recreate profiles policies using new has_role function
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 9: Recreate prompt_feedback policy
CREATE POLICY "Users can view feedback for prompts they can access"
ON public.prompt_feedback
FOR SELECT
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM prompts p
    WHERE p.id = prompt_feedback.prompt_id AND p.user_id = auth.uid()
  )) OR 
  public.has_role_access(auth.uid(), ARRAY['admin', 'editor', 'viewer'])
);

-- Step 10: Recreate invitations policy
CREATE POLICY "Admins can manage all invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 11: Fix invitation token exposure vulnerability
DROP POLICY IF EXISTS "Authenticated users can view invitations by email" ON public.invitations;
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.invitations;

-- Only allow users to see invitations sent to their email (remove the dangerous OR status = 'pending')
CREATE POLICY "Users can view invitations by email"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Step 12: Update trigger to assign default viewer role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Assign default viewer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  
  RETURN NEW;
END;
$$;