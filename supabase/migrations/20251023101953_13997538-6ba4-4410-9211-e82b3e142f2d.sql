-- Prefer non-empty public fields from instructors, fallback to profiles
CREATE OR REPLACE FUNCTION public.get_instructor_public_info(instructor_id uuid)
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
    COALESCE(i.id, p.id) AS id,
    COALESCE(NULLIF(i.full_name, ''), NULLIF(p.full_name, ''), '강사') AS full_name,
    COALESCE(NULLIF(i.instructor_bio, ''), NULLIF(p.instructor_bio, '')) AS instructor_bio,
    COALESCE(NULLIF(i.instructor_avatar_url, ''), NULLIF(p.instructor_avatar_url, '')) AS instructor_avatar_url,
    COALESCE(i.created_at, p.created_at) AS created_at,
    COALESCE(i.updated_at, p.updated_at) AS updated_at
  FROM public.instructors i
  FULL OUTER JOIN public.profiles p ON p.id = i.id
  WHERE COALESCE(i.id, p.id) = instructor_id
  LIMIT 1;
$$;