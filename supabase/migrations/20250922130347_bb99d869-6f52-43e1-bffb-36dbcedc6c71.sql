-- 프로필 테이블 RLS 정책 개선: 강사 정보는 공개하되 민감한 정보는 보호
DROP POLICY IF EXISTS "profiles_select_secure" ON public.profiles;

-- 새로운 보안 강화 정책: 강사의 민감한 정보 보호
CREATE POLICY "profiles_select_secure" 
ON public.profiles 
FOR SELECT 
USING (
  -- 자신의 프로필은 모든 정보 접근 가능
  (id = auth.uid()) 
  OR 
  -- 관리자는 모든 정보 접근 가능
  is_admin()
);

-- 강사 공개 정보만 조회할 수 있는 별도 정책 추가
CREATE POLICY "instructor_public_info_viewable" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'instructor' 
  AND auth.role() = 'authenticated'
  -- 이 정책으로는 full_name, instructor_bio, instructor_avatar_url만 접근하도록 
  -- 애플리케이션 레벨에서 SELECT 쿼리를 제한해야 함
);

-- 강사 공개 정보 조회를 위한 안전한 함수 생성
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
    p.id,
    p.full_name,
    p.instructor_bio,
    p.instructor_avatar_url,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.role = 'instructor' 
  AND (instructor_id IS NULL OR p.id = instructor_id);
$$;