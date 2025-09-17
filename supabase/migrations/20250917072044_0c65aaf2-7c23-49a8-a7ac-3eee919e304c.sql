-- Hotfix: Restore admin functionality and keep features working while maintaining security

-- 1) Restore is_admin() as SECURITY DEFINER (used across many RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2) Revert public instructor SELECT to not require authentication (to fix main page)
DROP POLICY IF EXISTS "Public can view instructor basic info" ON public.profiles;
DROP POLICY IF EXISTS "Public can view instructor profiles" ON public.profiles;
CREATE POLICY "Public can view instructor profiles"
ON public.profiles
FOR SELECT
USING (role = 'instructor');

-- 3) Keep users able to update their own profile for app functionality
--    Prevent role changes by non-admins using a trigger instead of complex RLS checks
DROP POLICY IF EXISTS "Users can update own profile (except role)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 4) Trigger to block role changes by non-admins
CREATE OR REPLACE FUNCTION public.prevent_role_change_by_non_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_role_change_by_non_admin ON public.profiles;
CREATE TRIGGER trg_prevent_role_change_by_non_admin
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change_by_non_admin();

-- 5) Ensure admins can view/update all profiles for admin panel
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());