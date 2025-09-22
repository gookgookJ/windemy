-- 보안 강화: 강사 프로필 직접 접근 차단 및 수강 정보 보호

-- 1. instructor_public_info_viewable 정책 제거 (보안 위험)
DROP POLICY IF EXISTS "instructor_public_info_viewable" ON public.profiles;

-- 2. enrollments 테이블 RLS 정책 강화
DROP POLICY IF EXISTS "enrollments_select_secure" ON public.enrollments;

-- 새로운 강화된 enrollments 선택 정책
CREATE POLICY "enrollments_select_secure" 
ON public.enrollments 
FOR SELECT 
USING (
  -- 자신의 수강 정보만 조회 가능
  (user_id = auth.uid()) 
  OR 
  -- 관리자는 모든 수강 정보 조회 가능
  is_admin()
  -- 강사의 자신 코스 수강생 조회 권한 제거 (개인정보 보호)
);

-- 3. 강사가 자신의 코스 통계만 볼 수 있는 안전한 함수 생성
CREATE OR REPLACE FUNCTION public.get_course_enrollment_stats(course_uuid uuid)
RETURNS TABLE(
  course_id uuid,
  total_enrollments bigint,
  completed_enrollments bigint,
  active_enrollments bigint
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.course_id,
    COUNT(*) as total_enrollments,
    COUNT(CASE WHEN e.completed_at IS NOT NULL THEN 1 END) as completed_enrollments,
    COUNT(CASE WHEN e.completed_at IS NULL THEN 1 END) as active_enrollments
  FROM public.enrollments e
  JOIN public.courses c ON c.id = e.course_id
  WHERE c.id = course_uuid 
  AND (c.instructor_id = auth.uid() OR is_admin())
  GROUP BY e.course_id;
$$;

-- 4. 보안 감사 로그 기록
INSERT INTO public.security_audit_logs (
  event_type,
  user_id,
  details
) VALUES (
  'security_policy_hardening',
  auth.uid(),
  jsonb_build_object(
    'action', 'removed_instructor_profile_access_and_hardened_enrollments',
    'affected_policies', ARRAY['instructor_public_info_viewable', 'enrollments_select_secure']
  )
);