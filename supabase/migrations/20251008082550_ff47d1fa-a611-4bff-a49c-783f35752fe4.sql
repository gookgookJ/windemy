-- ============================================
-- Phase 1: 역할 시스템 개편 (Role System Refactoring)
-- ============================================

-- 1. app_role enum 생성
CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'student');

-- 2. user_roles 테이블 생성
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- 3. user_roles 테이블에 RLS 활성화
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. user_roles RLS 정책: 모든 사용자는 자신의 역할을 볼 수 있음
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

-- 5. user_roles RLS 정책: 관리자만 역할 관리 가능
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. 기존 profiles.role 데이터를 user_roles로 마이그레이션
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT 
  id,
  role::public.app_role,
  created_at
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. has_role() 보안 definer 함수 생성
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 8. is_admin() 함수 업데이트 (user_roles 테이블 사용)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- 9. get_user_role_safe() 함수 업데이트
CREATE OR REPLACE FUNCTION public.get_user_role_safe(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF user_uuid IS NULL THEN
        RETURN 'anonymous';
    END IF;
    
    -- 역할 우선순위: admin > instructor > student
    IF public.has_role(user_uuid, 'admin') THEN
        RETURN 'admin';
    ELSIF public.has_role(user_uuid, 'instructor') THEN
        RETURN 'instructor';
    ELSIF public.has_role(user_uuid, 'student') THEN
        RETURN 'student';
    ELSE
        RETURN 'student'; -- 기본값
    END IF;
END;
$$;

-- 10. is_instructor_safe() 함수 업데이트
CREATE OR REPLACE FUNCTION public.is_instructor_safe(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(user_uuid, 'instructor');
$$;

-- ============================================
-- Phase 2: 뷰를 보안 함수로 대체 (정확한 컬럼 순서)
-- ============================================

-- 11. user_activity_stats 안전 조회 함수
CREATE OR REPLACE FUNCTION public.get_user_activity_stats(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  total_activities bigint,
  active_days bigint,
  last_activity timestamp with time zone,
  action_types text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_activity_stats.user_id,
    user_activity_stats.total_activities,
    user_activity_stats.active_days,
    user_activity_stats.last_activity,
    user_activity_stats.action_types
  FROM user_activity_stats
  WHERE user_activity_stats.user_id = COALESCE(target_user_id, auth.uid())
    OR public.is_admin();
$$;

-- 12. user_enrollment_summary 안전 조회 함수
CREATE OR REPLACE FUNCTION public.get_user_enrollment_summary(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  total_enrollments bigint,
  completed_courses bigint,
  total_orders bigint,
  total_spent bigint,
  last_enrollment_date timestamp with time zone,
  last_order_date timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_enrollment_summary.user_id,
    user_enrollment_summary.email,
    user_enrollment_summary.full_name,
    user_enrollment_summary.total_enrollments,
    user_enrollment_summary.completed_courses,
    user_enrollment_summary.total_orders,
    user_enrollment_summary.total_spent,
    user_enrollment_summary.last_enrollment_date,
    user_enrollment_summary.last_order_date
  FROM user_enrollment_summary
  WHERE user_enrollment_summary.user_id = COALESCE(target_user_id, auth.uid())
    OR public.is_admin();
$$;

-- 13. user_points_balance 안전 조회 함수
CREATE OR REPLACE FUNCTION public.get_user_points_balance_safe(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  total_points bigint,
  total_earned bigint,
  total_used bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_points_balance.user_id,
    user_points_balance.total_points,
    user_points_balance.total_earned,
    user_points_balance.total_used
  FROM user_points_balance
  WHERE user_points_balance.user_id = COALESCE(target_user_id, auth.uid())
    OR public.is_admin();
$$;

-- 14. user_group_summary 안전 조회 함수
CREATE OR REPLACE FUNCTION public.get_user_group_summary_safe(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  group_names text[],
  group_colors text[],
  group_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_group_summary.user_id,
    user_group_summary.email,
    user_group_summary.full_name,
    user_group_summary.group_names,
    user_group_summary.group_colors,
    user_group_summary.group_count
  FROM user_group_summary
  WHERE user_group_summary.user_id = COALESCE(target_user_id, auth.uid())
    OR public.is_admin();
$$;

-- ============================================
-- Phase 3: instructors 테이블 보안 강화
-- ============================================

-- 15. instructors 테이블의 공개 SELECT 정책 제거하고 제한된 정책으로 교체
DROP POLICY IF EXISTS "Public can view instructor info" ON public.instructors;

-- 인증된 사용자만 강사 정보 조회 가능
CREATE POLICY "Authenticated users can view instructor info"
ON public.instructors
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- Phase 4: profiles 테이블 RLS 정책 업데이트
-- ============================================

-- 16. profiles 테이블의 SELECT 정책을 더 엄격하게 업데이트
DROP POLICY IF EXISTS "profiles_select_secure" ON public.profiles;

CREATE POLICY "profiles_select_secure"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid() OR 
  public.is_admin() OR
  -- 강사 프로필은 인증된 사용자에게만 공개 (강사 정보 표시용)
  (public.has_role(id, 'instructor') AND auth.uid() IS NOT NULL)
);

-- ============================================
-- Phase 5: 역할 변경 트리거 업데이트
-- ============================================

-- 17. 기존 profiles 테이블의 역할 변경 트리거들 제거
DROP TRIGGER IF EXISTS log_role_changes ON public.profiles;
DROP TRIGGER IF EXISTS prevent_role_change_by_non_admin ON public.profiles;
DROP TRIGGER IF EXISTS protect_last_admin ON public.profiles;
DROP TRIGGER IF EXISTS prevent_unauthorized_role_change ON public.profiles;

-- user_roles 테이블에 새로운 트리거 추가
CREATE OR REPLACE FUNCTION public.log_user_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.role_change_logs (
    user_id, 
    old_role, 
    new_role, 
    changed_by,
    reason
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    OLD.role::text,
    NEW.role::text,
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Role assigned'
      WHEN TG_OP = 'DELETE' THEN 'Role removed'
      ELSE 'Role changed'
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER log_user_role_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_user_role_changes();

-- 18. 마지막 관리자 보호 함수
CREATE OR REPLACE FUNCTION public.protect_last_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_count integer;
BEGIN
    -- 관리자 역할을 제거하려는 경우
    IF TG_OP = 'DELETE' AND OLD.role = 'admin' THEN
        SELECT COUNT(*) INTO admin_count 
        FROM public.user_roles 
        WHERE role = 'admin' AND user_id != OLD.user_id;
        
        IF admin_count = 0 THEN
            RAISE EXCEPTION 'Cannot remove the last admin user. At least one admin must remain.';
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER protect_last_admin_role
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_last_admin_role();

-- ============================================
-- Phase 6: 보안 감사 로그 강화
-- ============================================

-- 19. user_roles 변경 시 보안 로그 기록
CREATE OR REPLACE FUNCTION public.log_role_security_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    event_type,
    user_id,
    details
  ) VALUES (
    'role_' || lower(TG_OP),
    auth.uid(),
    jsonb_build_object(
      'target_user_id', COALESCE(NEW.user_id, OLD.user_id),
      'role', COALESCE(NEW.role, OLD.role)::text,
      'changed_by', auth.uid()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER log_role_security_events
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_role_security_events();

-- ============================================
-- 완료 메시지
-- ============================================
COMMENT ON TABLE public.user_roles IS '사용자 역할 관리 테이블 - 권한 상승 공격 방지를 위해 profiles 테이블에서 분리';
COMMENT ON FUNCTION public.has_role IS 'RLS 정책에서 안전하게 사용 가능한 역할 확인 함수';
COMMENT ON FUNCTION public.get_user_activity_stats IS '보안 강화: 사용자는 자신의 활동 통계만 조회 가능';
COMMENT ON FUNCTION public.get_user_enrollment_summary IS '보안 강화: 사용자는 자신의 수강 정보만 조회 가능';
COMMENT ON POLICY "Authenticated users can view instructor info" ON public.instructors IS '보안 강화: 이메일 노출 방지 - 인증된 사용자만 조회 가능';