-- Improved instructor public info resolution: map by id/email/name to instructors when profile id is used
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
  -- Prefer matching instructor by id; if course uses a profile id, map via email/name
  (
    SELECT 
      COALESCE(ci.id, p.id) AS id,
      COALESCE(NULLIF(ci.full_name, ''), NULLIF(p.full_name, ''), '강사') AS full_name,
      COALESCE(NULLIF(ci.instructor_bio, ''), NULLIF(p.instructor_bio, '')) AS instructor_bio,
      COALESCE(NULLIF(ci.instructor_avatar_url, ''), NULLIF(p.instructor_avatar_url, '')) AS instructor_avatar_url,
      COALESCE(ci.created_at, p.created_at) AS created_at,
      COALESCE(ci.updated_at, p.updated_at) AS updated_at
    FROM public.profiles p
    LEFT JOIN LATERAL (
      SELECT i.*
      FROM public.instructors i
      WHERE i.id = instructor_id
         OR (p.email IS NOT NULL AND i.email = p.email)
         OR (p.full_name IS NOT NULL AND i.full_name = p.full_name)
      ORDER BY (i.id = instructor_id) DESC, i.updated_at DESC, i.created_at DESC
      LIMIT 1
    ) ci ON true
    WHERE p.id = instructor_id
  )
  UNION ALL
  (
    -- If there is no profile row with that id, return instructors row directly
    SELECT 
      i.id,
      COALESCE(NULLIF(i.full_name, ''), '강사') AS full_name,
      NULLIF(i.instructor_bio, '') AS instructor_bio,
      NULLIF(i.instructor_avatar_url, '') AS instructor_avatar_url,
      i.created_at,
      i.updated_at
    FROM public.instructors i
    WHERE i.id = instructor_id
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles p2 WHERE p2.id = instructor_id
      )
  )
  LIMIT 1;
$$;