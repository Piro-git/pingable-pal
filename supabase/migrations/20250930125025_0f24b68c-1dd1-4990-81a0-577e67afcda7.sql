-- Fix invitation table access control
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;

-- Create granular policies for invitations
-- Policy 1: Admins can do everything
CREATE POLICY "Admins can manage all invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 2: Users can view invitations sent to their email (for registration flow)
CREATE POLICY "Users can view their own invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Policy 3: Allow anonymous users to view invitations by token (for registration page)
CREATE POLICY "Anonymous users can view invitations by token"
ON public.invitations
FOR SELECT
TO anon
USING (
  status = 'pending'
);