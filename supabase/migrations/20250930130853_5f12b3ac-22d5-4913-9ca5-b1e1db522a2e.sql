-- Fix security issue: Remove overly permissive anonymous access to invitations table
-- Drop the policy that allows anonymous users to view all pending invitations
DROP POLICY IF EXISTS "Anonymous users can view invitations by token" ON public.invitations;

-- Create a more secure policy that only allows authenticated users to view invitations
-- Anonymous users will validate invitations through a secure edge function instead
CREATE POLICY "Authenticated users can view invitations by email" 
ON public.invitations 
FOR SELECT 
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR status = 'pending'
);

-- Note: The invitation acceptance flow will now use a secure edge function
-- that validates tokens using the service role key, bypassing RLS entirely