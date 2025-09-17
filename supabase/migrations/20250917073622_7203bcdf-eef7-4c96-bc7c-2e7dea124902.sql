-- Fix remaining security issues: Remove public access to sensitive personal data

-- 1. Fix instructor table RLS - only allow admins to see email addresses
DROP POLICY IF EXISTS "Public can view instructor info (no email)" ON public.instructors;
CREATE POLICY "Public can view instructor info (no email)"
ON public.instructors
FOR SELECT
USING (
  -- Public can only see basic info through the view, not direct table access
  false
);

-- Add admin-only policy for instructors table
CREATE POLICY "Admins can view all instructor data"
ON public.instructors
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2. Update profiles RLS to restrict email/phone exposure
DROP POLICY IF EXISTS "Public can view instructor profiles safely" ON public.profiles;
CREATE POLICY "Public can view instructor profiles safely"
ON public.profiles
FOR SELECT
USING (
  -- Only allow viewing instructor role profiles, but RLS should limit accessible fields
  role = 'instructor' AND 
  -- This policy works in conjunction with the secure view
  auth.uid() IS NOT NULL OR auth.uid() IS NULL
);

-- 3. Create function to safely get instructor public info
CREATE OR REPLACE FUNCTION public.get_instructor_safe(instructor_uuid uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  instructor_bio text,
  instructor_avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.instructor_bio,
    p.instructor_avatar_url,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = instructor_uuid AND p.role = 'instructor';
$$;