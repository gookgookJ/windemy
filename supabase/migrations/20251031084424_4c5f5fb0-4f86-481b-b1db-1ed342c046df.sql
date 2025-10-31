-- Replace get_current_user_role() to use user_roles instead of profiles.role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Delegate to the safe role resolver that reads from user_roles
  SELECT public.get_user_role_safe();
$$;