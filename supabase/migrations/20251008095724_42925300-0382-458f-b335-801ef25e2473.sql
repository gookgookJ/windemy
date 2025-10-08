-- Fix: Make get_instructor_safe read from instructors table (source of truth)
DROP FUNCTION IF EXISTS public.get_instructor_safe(uuid);

CREATE OR REPLACE FUNCTION public.get_instructor_safe(instructor_uuid uuid)
RETURNS TABLE (
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
    id,
    full_name,
    instructor_bio,
    instructor_avatar_url,
    created_at,
    updated_at
  FROM public.instructors
  WHERE id = instructor_uuid;
$$;

-- Ensure anon and authenticated users can execute this function
GRANT EXECUTE ON FUNCTION public.get_instructor_safe(uuid) TO anon, authenticated;