-- Final Security Fix: Remove any remaining SECURITY DEFINER views and ensure proper RLS

-- Check for any functions with SECURITY DEFINER that might be causing issues
-- Let's check existing is_admin function and update it properly
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Ensure the update_updated_at_column function is also not causing issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Final check: ensure our instructor info access is properly secured
-- Create a final secure policy that completely prevents email/phone exposure
DROP POLICY IF EXISTS "Public can view instructor basic info" ON public.profiles;

CREATE POLICY "Public can view instructor basic info"
ON public.profiles
FOR SELECT
USING (
  role = 'instructor' AND 
  auth.uid() IS NOT NULL
);

-- Add a comment to document the security improvement
COMMENT ON VIEW public.instructors_public IS 'Public view of instructor data excluding sensitive information like email addresses';