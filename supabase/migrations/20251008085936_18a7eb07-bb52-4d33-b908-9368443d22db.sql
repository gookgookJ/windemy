-- ============================================
-- 🔴 Phase 1-2: Storage 정책 수정 및 profiles.role 컬럼 삭제
-- ============================================

-- Step 1: Storage 정책들을 has_role() 함수 기반으로 변경
-- (profiles.role 의존성 제거)

-- Course Thumbnails 정책
DROP POLICY IF EXISTS "Admins and instructors can upload course thumbnails" ON storage.objects;
CREATE POLICY "Admins and instructors can upload course thumbnails"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-thumbnails' AND
  (public.is_admin() OR public.has_role(auth.uid(), 'instructor'))
);

DROP POLICY IF EXISTS "Admins and instructors can update course thumbnails" ON storage.objects;
CREATE POLICY "Admins and instructors can update course thumbnails"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-thumbnails' AND
  (public.is_admin() OR public.has_role(auth.uid(), 'instructor'))
);

-- Course Detail Images 정책
DROP POLICY IF EXISTS "Admins and instructors can upload course detail images" ON storage.objects;
CREATE POLICY "Admins and instructors can upload course detail images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-detail-images' AND
  (public.is_admin() OR public.has_role(auth.uid(), 'instructor'))
);

DROP POLICY IF EXISTS "Admins and instructors can update course detail images" ON storage.objects;
CREATE POLICY "Admins and instructors can update course detail images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-detail-images' AND
  (public.is_admin() OR public.has_role(auth.uid(), 'instructor'))
);

-- Course Files 정책
DROP POLICY IF EXISTS "Course files are viewable by enrolled users" ON storage.objects;
CREATE POLICY "Course files are viewable by enrolled users"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'course-files' AND
  (public.is_admin() OR 
   public.has_role(auth.uid(), 'instructor') OR
   auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS "Admins and instructors can upload course files" ON storage.objects;
CREATE POLICY "Admins and instructors can upload course files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-files' AND
  (public.is_admin() OR public.has_role(auth.uid(), 'instructor'))
);

DROP POLICY IF EXISTS "Admins and instructors can update course files" ON storage.objects;
CREATE POLICY "Admins and instructors can update course files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-files' AND
  (public.is_admin() OR public.has_role(auth.uid(), 'instructor'))
);

DROP POLICY IF EXISTS "Admins can manage all section files" ON storage.objects;
CREATE POLICY "Admins can manage all section files"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'course-files' AND public.is_admin()
);

-- Hero Images 정책
DROP POLICY IF EXISTS "Admins can upload hero images" ON storage.objects;
CREATE POLICY "Admins can upload hero images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'hero-images' AND public.is_admin()
);

DROP POLICY IF EXISTS "Admins can update hero images" ON storage.objects;
CREATE POLICY "Admins can update hero images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'hero-images' AND public.is_admin()
);

DROP POLICY IF EXISTS "Admins can delete hero images" ON storage.objects;
CREATE POLICY "Admins can delete hero images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'hero-images' AND public.is_admin()
);

-- Step 2: 이제 profiles.role 컬럼 삭제 가능
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- ============================================
-- 🔴 Phase 2: 강사 이메일 보호
-- ============================================

-- 2-1. 공개용 강사 정보 조회 함수 (이메일 제외)
CREATE OR REPLACE FUNCTION public.get_instructors_public()
RETURNS TABLE (
  id uuid,
  full_name text,
  instructor_bio text,
  instructor_avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.instructor_bio,
        p.instructor_avatar_url,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    WHERE public.has_role(p.id, 'instructor');
END;
$$;

-- 2-2. 특정 강사의 공개 정보 조회 함수
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
    p.id,
    p.full_name,
    p.instructor_bio,
    p.instructor_avatar_url,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = instructor_uuid AND public.has_role(p.id, 'instructor');
$$;

-- 2-3. instructors 테이블 RLS 정책 강화 (관리자만 이메일 접근 가능)
DROP POLICY IF EXISTS "Authenticated users can view instructor info" ON public.instructors;

CREATE POLICY "Only admins can view full instructor data"
ON public.instructors
FOR SELECT
USING (public.is_admin());

-- ============================================
-- 🟡 Phase 4: 활동 로그 민감정보 보호
-- ============================================

-- 4-1. 사용자용 활동 로그 조회 함수 (IP 및 User Agent 제외)
CREATE OR REPLACE FUNCTION public.get_user_activity_logs(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  action text,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    user_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  FROM public.activity_logs
  WHERE user_id = COALESCE(target_user_id, auth.uid())
    OR public.is_admin();
$$;

-- ============================================
-- ✅ 보안 강화 완료
-- ============================================
-- ✅ Storage 정책을 user_roles 기반으로 변경
-- ✅ profiles.role 컬럼 제거로 권한 상승 공격 차단
-- ✅ 강사 이메일 보호로 개인정보 노출 방지
-- ✅ 활동 로그 민감정보 보호로 프라이버시 강화