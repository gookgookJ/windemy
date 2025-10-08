-- Fix get_instructor_public_info to use instructors table instead of profiles.role
DROP FUNCTION IF EXISTS public.get_instructor_public_info(uuid);

CREATE OR REPLACE FUNCTION public.get_instructor_public_info(instructor_id uuid DEFAULT NULL)
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
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.full_name,
    i.instructor_bio,
    i.instructor_avatar_url,
    i.created_at,
    i.updated_at
  FROM public.instructors i
  WHERE (instructor_id IS NULL OR i.id = instructor_id);
$$;