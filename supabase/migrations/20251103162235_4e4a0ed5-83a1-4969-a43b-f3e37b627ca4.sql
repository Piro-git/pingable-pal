-- Fix invitations RLS policy that's causing permission denied error
-- The issue is the policy references auth.users table directly which requires special permissions
-- We'll use auth.email() function instead

DROP POLICY IF EXISTS "Users can view invitations by email" ON public.invitations;

CREATE POLICY "Users can view invitations by email"
ON public.invitations
FOR SELECT
TO authenticated
USING (email = auth.email()::text);
