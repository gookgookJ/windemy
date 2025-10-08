-- Rollback and compatibility fix: make get_instructor_safe read from profiles first, then fallback to instructors
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
  (
    SELECT 
      p.id,
      p.full_name,
      p.instructor_bio,
      p.instructor_avatar_url,
      p.created_at,
      p.updated_at
    FROM public.profiles p
    WHERE p.id = instructor_uuid
  )
  UNION ALL
  (
    SELECT 
      i.id,
      i.full_name,
      i.instructor_bio,
      i.instructor_avatar_url,
      i.created_at,
      i.updated_at
    FROM public.instructors i
    WHERE i.id = instructor_uuid
  )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_instructor_safe(uuid) TO anon, authenticated;