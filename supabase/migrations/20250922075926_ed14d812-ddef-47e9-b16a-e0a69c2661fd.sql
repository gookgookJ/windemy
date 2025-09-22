-- 완전한 역할 보안 시스템 구축 (의존성 문제 해결) - 수정된 버전

-- 1. 필수 로깅 테이블 생성
CREATE TABLE IF NOT EXISTS public.role_change_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    old_role text,
    new_role text,
    changed_by uuid,
    reason text,
    changed_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    user_id uuid,
    details jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. 로깅 테이블에 대한 RLS 정책 설정 (기존 정책 먼저 삭제)
ALTER TABLE public.role_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Admins can view role change logs" ON public.role_change_logs;
DROP POLICY IF EXISTS "System can insert role change logs" ON public.role_change_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_logs;

-- role_change_logs 정책
CREATE POLICY "Admins can view role change logs" ON public.role_change_logs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "System can insert role change logs" ON public.role_change_logs
    FOR INSERT WITH CHECK (true);

-- security_audit_logs 정책
CREATE POLICY "Admins can view audit logs" ON public.security_audit_logs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "System can insert audit logs" ON public.security_audit_logs
    FOR INSERT WITH CHECK (true);

-- 3. 기존 트리거들 정리 후 새로 생성
DROP TRIGGER IF EXISTS prevent_role_change_by_non_admin_trigger ON public.profiles;
DROP TRIGGER IF EXISTS log_role_changes_trigger ON public.profiles;
DROP TRIGGER IF EXISTS protect_last_admin_trigger ON public.profiles;

-- 4. 역할 변경 보안 정책 강화 (일반 사용자가 자신의 역할을 admin으로 바꾸는 것을 방지)
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS trigger AS $$
BEGIN
    -- 역할이 변경되려는 경우
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        -- 관리자가 아닌 사용자가 자신의 역할을 변경하려는 경우
        IF auth.uid() = NEW.id AND NOT public.is_admin() THEN
            -- 일반 사용자는 student <-> instructor만 가능 (admin 불가)
            IF NEW.role = 'admin' THEN
                RAISE EXCEPTION 'Permission denied: Cannot set admin role without admin privileges';
            END IF;
        END IF;
        
        -- 관리자가 아닌 사용자가 다른 사람의 역할을 변경하려는 경우
        IF auth.uid() != NEW.id AND NOT public.is_admin() THEN
            RAISE EXCEPTION 'Permission denied: Only admins can change other users roles';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. 역할 변경 로깅 강화
CREATE OR REPLACE FUNCTION public.log_role_changes_enhanced()
RETURNS trigger AS $$
BEGIN
    -- 역할이 실제로 변경된 경우에만 로깅
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO public.role_change_logs (
            user_id, 
            old_role, 
            new_role, 
            changed_by,
            reason
        ) VALUES (
            NEW.id, 
            OLD.role, 
            NEW.role, 
            auth.uid(),
            CASE 
                WHEN auth.uid() = NEW.id THEN 'Self-changed'
                WHEN public.is_admin() THEN 'Admin-changed'
                ELSE 'Unknown'
            END
        );
        
        -- 보안 감사 로그에도 기록
        INSERT INTO public.security_audit_logs (
            event_type,
            user_id,
            details
        ) VALUES (
            'role_change',
            auth.uid(),
            jsonb_build_object(
                'target_user_id', NEW.id,
                'old_role', OLD.role,
                'new_role', NEW.role,
                'changed_by', auth.uid()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. 관리자 계정 보호 정책 (최소 1명의 관리자는 항상 유지)
CREATE OR REPLACE FUNCTION public.protect_last_admin()
RETURNS trigger AS $$
DECLARE
    admin_count integer;
BEGIN
    -- 관리자 역할을 제거하려는 경우
    IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
        SELECT COUNT(*) INTO admin_count 
        FROM public.profiles 
        WHERE role = 'admin' AND id != OLD.id;
        
        -- 마지막 관리자인 경우 변경 방지
        IF admin_count = 0 THEN
            RAISE EXCEPTION 'Cannot remove the last admin user. At least one admin must remain.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. 트리거 생성
CREATE TRIGGER prevent_role_change_by_non_admin_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_unauthorized_role_change();

CREATE TRIGGER log_role_changes_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_role_changes_enhanced();

CREATE TRIGGER protect_last_admin_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_last_admin();

-- 8. 권한 부여
GRANT EXECUTE ON FUNCTION public.prevent_unauthorized_role_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_role_changes_enhanced() TO authenticated;
GRANT EXECUTE ON FUNCTION public.protect_last_admin() TO authenticated;

-- 9. 함수 설명
COMMENT ON FUNCTION public.prevent_unauthorized_role_change() IS '무단 역할 변경 방지 트리거 함수';
COMMENT ON FUNCTION public.log_role_changes_enhanced() IS '강화된 역할 변경 로깅 함수';
COMMENT ON FUNCTION public.protect_last_admin() IS '마지막 관리자 보호 함수';