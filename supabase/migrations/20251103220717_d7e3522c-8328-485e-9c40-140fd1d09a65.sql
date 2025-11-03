-- ==========================================
-- FIX 2: Admin Role Escalation Prevention
-- ==========================================

-- Create audit table for role changes
CREATE TABLE user_role_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_role app_role,
  new_role app_role NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE user_role_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
ON user_role_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create secure role assignment function
CREATE OR REPLACE FUNCTION assign_user_role(
  target_user_id UUID,
  new_role app_role,
  change_reason TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role app_role;
  caller_id UUID;
BEGIN
  caller_id := auth.uid();
  
  -- Verify caller is admin
  IF NOT has_role(caller_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;
  
  -- Prevent self-assignment of admin role
  IF caller_id = target_user_id AND new_role = 'admin'::app_role THEN
    RAISE EXCEPTION 'Cannot self-assign admin role';
  END IF;
  
  -- Get current role
  SELECT role INTO old_role FROM user_roles WHERE user_id = target_user_id;
  
  -- Delete existing role
  DELETE FROM user_roles WHERE user_id = target_user_id;
  
  -- Insert new role
  INSERT INTO user_roles (user_id, role) VALUES (target_user_id, new_role);
  
  -- Audit log
  INSERT INTO user_role_audit (target_user_id, old_role, new_role, changed_by, change_reason)
  VALUES (target_user_id, old_role, new_role, caller_id, change_reason);
  
  RAISE NOTICE 'Role changed from % to % for user % by %', old_role, new_role, target_user_id, caller_id;
END;
$$;

-- ==========================================
-- FIX 3: Invitation Email Verification
-- ==========================================

-- Add columns to track who accepted invitation
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;