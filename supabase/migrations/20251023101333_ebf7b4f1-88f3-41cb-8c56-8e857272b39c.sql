-- get_instructor_public_info 함수를 수정하여 
-- instructors와 profiles 테이블 모두 확인하고 공개 정보만 반환
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
  -- instructors 테이블에서 먼저 조회
  SELECT 
    i.id,
    i.full_name,
    i.instructor_bio,
    i.instructor_avatar_url,
    i.created_at,
    i.updated_at
  FROM public.instructors i
  WHERE i.id = instructor_id
  
  UNION ALL
  
  -- instructors에 없으면 profiles에서 조회 (공개 정보만)
  SELECT 
    p.id,
    p.full_name,
    p.instructor_bio,
    p.instructor_avatar_url,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = instructor_id
    AND NOT EXISTS (
      SELECT 1 FROM public.instructors i2 WHERE i2.id = instructor_id
    )
  
  LIMIT 1;
$$;