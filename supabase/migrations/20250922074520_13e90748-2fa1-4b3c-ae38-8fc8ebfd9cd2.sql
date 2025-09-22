-- Role 보안 강화 및 누락된 정책 완성

-- 1. 역할 변경 보안 정책 강화 (일반 사용자가 자신의 역할을 admin으로 바꾸는 것을 방지)
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS trigger AS $$
BEGIN
    -- 역할이 변경되려는 경우
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        -- 관리자가 아닌 사용자가 자신의 역할을 변경하려는 경우
        IF auth.uid() = NEW.id AND NOT is_admin() THEN
            -- 일반 사용자는 student <-> instructor만 가능 (admin 불가)
            IF NEW.role = 'admin' THEN
                RAISE EXCEPTION 'Permission denied: Cannot set admin role without admin privileges';
            END IF;
        END IF;
        
        -- 관리자가 아닌 사용자가 다른 사람의 역할을 변경하려는 경우
        IF auth.uid() != NEW.id AND NOT is_admin() THEN
            RAISE EXCEPTION 'Permission denied: Only admins can change other users roles';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 기존 트리거가 있다면 삭제 후 새로 생성
DROP TRIGGER IF EXISTS prevent_role_change_by_non_admin_trigger ON public.profiles;
CREATE TRIGGER prevent_role_change_by_non_admin_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_unauthorized_role_change();

-- 2. 역할 변경 로깅 강화
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
                WHEN is_admin() THEN 'Admin-changed'
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

-- 기존 트리거 교체
DROP TRIGGER IF EXISTS log_role_changes_trigger ON public.profiles;
CREATE TRIGGER log_role_changes_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_role_changes_enhanced();

-- 3. 관리자 계정 보호 정책 (최소 1명의 관리자는 항상 유지)
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

CREATE TRIGGER protect_last_admin_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_last_admin();

-- 4. 테스트용 샘플 데이터 확인 및 수정 함수
CREATE OR REPLACE FUNCTION public.ensure_test_users()
RETURNS text AS $$
DECLARE
    admin_count integer;
    instructor_count integer;
    student_count integer;
    result text := '';
BEGIN
    -- 현재 역할별 사용자 수 확인
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    SELECT COUNT(*) INTO instructor_count FROM public.profiles WHERE role = 'instructor';
    SELECT COUNT(*) INTO student_count FROM public.profiles WHERE role = 'student';
    
    result := result || '현재 사용자 현황:' || E'\n';
    result := result || '- 관리자: ' || admin_count::text || '명' || E'\n';
    result := result || '- 강사: ' || instructor_count::text || '명' || E'\n';
    result := result || '- 학생: ' || student_count::text || '명' || E'\n' || E'\n';
    
    -- 관리자가 없는 경우 경고
    IF admin_count = 0 THEN
        result := result || '⚠️ 경고: 관리자 계정이 없습니다!' || E'\n';
        result := result || '   관리자 설정이 필요합니다.' || E'\n';
    END IF;
    
    result := result || E'\n💡 관리자 역할 변경 (관리자만 실행 가능):' || E'\n';
    result := result || 'UPDATE profiles SET role = ''admin'' WHERE email = ''your-email@example.com'';';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. 강화된 보안 체크 함수 (역할 보안 포함)
CREATE OR REPLACE FUNCTION public.security_comprehensive_check()
RETURNS text AS $$
DECLARE
    result text := '';
    current_role text := public.get_user_role_safe();
    is_admin_user boolean := is_admin();
    profile_access_count integer;
    enrollment_access_count integer;
    admin_count integer;
    total_profiles integer;
BEGIN
    result := result || '=== 🔒 종합 보안 상태 체크 ===' || E'\n';
    result := result || 'Current User ID: ' || COALESCE(auth.uid()::text, 'NULL') || E'\n';
    result := result || 'Current User Role: ' || COALESCE(current_role, 'NULL') || E'\n';
    result := result || 'Is Admin: ' || is_admin_user::text || E'\n' || E'\n';
    
    -- 역할별 사용자 수 확인
    SELECT COUNT(*) INTO total_profiles FROM public.profiles;
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
    
    result := result || '👥 Total Profiles: ' || total_profiles::text || E'\n';
    result := result || '👑 Admins: ' || admin_count::text;
    
    IF admin_count = 0 THEN
        result := result || ' ⚠️ NO ADMINS!';
    ELSIF admin_count = 1 THEN
        result := result || ' ⚠️ ONLY ONE ADMIN';
    ELSE
        result := result || ' ✅ OK';
    END IF;
    
    result := result || E'\n';
    
    -- 데이터 접근 테스트
    SELECT COUNT(*) INTO profile_access_count 
    FROM public.profiles 
    WHERE id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000001');
    
    result := result || '👁️ Other Users Profiles Accessible: ' || profile_access_count::text;
    
    IF NOT is_admin_user AND profile_access_count > (SELECT COUNT(*) FROM public.profiles WHERE role = 'instructor') THEN
        result := result || ' ⚠️ SECURITY ISSUE!';
    ELSE
        result := result || ' ✅ OK';
    END IF;
    
    result := result || E'\n';
    
    SELECT COUNT(*) INTO enrollment_access_count 
    FROM public.enrollments 
    WHERE user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000001');
    
    result := result || '📚 Other Users Enrollments Accessible: ' || enrollment_access_count::text;
    
    IF NOT is_admin_user AND enrollment_access_count > 0 THEN
        result := result || ' ⚠️ SECURITY ISSUE!';
    ELSE
        result := result || ' ✅ OK';
    END IF;
    
    result := result || E'\n' || E'\n';
    result := result || '🧪 테스트 명령어:' || E'\n';
    result := result || '📊 종합 테스트: SELECT * FROM public.test_rls_security();' || E'\n';
    result := result || '👥 사용자 현황: SELECT public.ensure_test_users();' || E'\n';
    result := result || '🔒 종합 체크: SELECT public.security_comprehensive_check();';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. 권한 부여
GRANT EXECUTE ON FUNCTION public.prevent_unauthorized_role_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_role_changes_enhanced() TO authenticated;
GRANT EXECUTE ON FUNCTION public.protect_last_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_test_users() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.security_comprehensive_check() TO authenticated, anon;

-- 7. 함수 설명
COMMENT ON FUNCTION public.prevent_unauthorized_role_change() IS '무단 역할 변경 방지 트리거 함수';
COMMENT ON FUNCTION public.log_role_changes_enhanced() IS '강화된 역할 변경 로깅 함수';
COMMENT ON FUNCTION public.protect_last_admin() IS '마지막 관리자 보호 함수';
COMMENT ON FUNCTION public.ensure_test_users() IS '테스트 사용자 현황 확인 및 관리자 설정 가이드';
COMMENT ON FUNCTION public.security_comprehensive_check() IS '종합 보안 상태 체크 (역할 보안 포함)';