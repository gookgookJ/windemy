-- Final Security Fix: Update view to use security_invoker for proper RLS enforcement

-- Drop and recreate the instructors_public view with security_invoker for Postgres 15+
DROP VIEW IF EXISTS public.instructors_public;

-- Create view with security_invoker to enforce RLS properly
CREATE VIEW public.instructors_public
WITH (security_invoker = true) AS
SELECT 
  id,
  full_name,
  instructor_bio,
  instructor_avatar_url,
  created_at,
  updated_at
FROM public.instructors;

-- Grant access to the view
GRANT SELECT ON public.instructors_public TO authenticated, anon;

-- Update function to use security invoker instead of security definer where appropriate
CREATE OR REPLACE FUNCTION public.get_instructor_public_info(instructor_uuid uuid)
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
    i.id,
    i.full_name,
    i.instructor_bio,
    i.instructor_avatar_url,
    i.created_at,
    i.updated_at
  FROM instructors_public i
  WHERE i.id = instructor_uuid;
$$;