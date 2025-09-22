-- RLS 보안 테스트 시스템 추가 (정책은 이미 올바르게 구성됨)

-- 1. 보안 역할 확인 함수 추가
CREATE OR REPLACE FUNCTION public.get_user_role_safe(user_uuid uuid DEFAULT auth.uid())
RETURNS text AS $$
BEGIN
    IF user_uuid IS NULL THEN
        RETURN 'anonymous';
    END IF;
    
    RETURN (
        SELECT COALESCE(role, 'student') 
        FROM public.profiles 
        WHERE id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_instructor_safe(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN public.get_user_role_safe(user_uuid) = 'instructor';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 2. 보안 테스트 종합 함수
CREATE OR REPLACE FUNCTION public.test_rls_security()
RETURNS TABLE(
    test_name text,
    table_name text,
    expected_result text,
    actual_result text,
    status text
) AS $$
DECLARE
    current_user_id uuid := auth.uid();
    test_user_id uuid := '00000000-0000-0000-0000-000000000001';
    profile_count integer;
    enrollment_count integer;
    progress_count integer;
    instructor_count integer;
BEGIN
    -- 현재 사용자 역할 확인
    RETURN QUERY SELECT 
        'User Role Check'::text,
        'profiles'::text,
        'Should return current user role'::text,
        COALESCE(public.get_user_role_safe(), 'NULL')::text,
        'INFO'::text;

    -- 관리자 권한 확인
    RETURN QUERY SELECT 
        'Admin Check'::text,
        'profiles'::text,
        'Should return true/false'::text,
        is_admin()::text,
        'INFO'::text;

    -- 강사 수 확인
    SELECT COUNT(*) INTO instructor_count FROM public.profiles WHERE role = 'instructor';

    -- profiles 테이블 접근 테스트 (다른 사용자 프로필)
    SELECT COUNT(*) INTO profile_count 
    FROM public.profiles 
    WHERE id != COALESCE(current_user_id, test_user_id);
    
    RETURN QUERY SELECT 
        'Other Users Profiles Access'::text,
        'profiles'::text,
        CASE WHEN is_admin() THEN 'Should see all profiles' ELSE 'Should see only instructors (' || instructor_count::text || ')' END::text,
        profile_count::text,
        CASE 
            WHEN is_admin() THEN 'PASS'
            WHEN profile_count <= instructor_count THEN 'PASS'
            ELSE 'FAIL - Can see other users profiles'
        END::text;

    -- enrollments 테이블 접근 테스트 (다른 사용자 수강정보)
    SELECT COUNT(*) INTO enrollment_count 
    FROM public.enrollments 
    WHERE user_id != COALESCE(current_user_id, test_user_id);
    
    RETURN QUERY SELECT 
        'Other Users Enrollments Access'::text,
        'enrollments'::text,
        CASE WHEN is_admin() THEN 'Should see all enrollments' ELSE 'Should see 0 enrollments' END::text,
        enrollment_count::text,
        CASE 
            WHEN is_admin() THEN 'PASS'
            WHEN enrollment_count = 0 THEN 'PASS'
            ELSE 'FAIL - Can see other users enrollments'
        END::text;

    -- session_progress 테이블 접근 테스트 (다른 사용자 진도)
    SELECT COUNT(*) INTO progress_count 
    FROM public.session_progress 
    WHERE user_id != COALESCE(current_user_id, test_user_id);
    
    RETURN QUERY SELECT 
        'Other Users Progress Access'::text,
        'session_progress'::text,
        CASE WHEN is_admin() THEN 'Should see all progress' ELSE 'Should see 0 progress records' END::text,
        progress_count::text,
        CASE 
            WHEN is_admin() THEN 'PASS'
            WHEN progress_count = 0 THEN 'PASS'
            ELSE 'FAIL - Can see other users progress'
        END::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. 빠른 보안 체크 함수 (콘솔용)
CREATE OR REPLACE FUNCTION public.security_quick_check()
RETURNS text AS $$
DECLARE
    result text := '';
    current_role text := public.get_user_role_safe();
    is_admin_user boolean := is_admin();
    profile_access_count integer;
    enrollment_access_count integer;
    instructor_count integer;
    total_profiles integer;
BEGIN
    result := result || '=== 🔒 RLS 보안 상태 체크 ===' || E'\n';
    result := result || 'Current User ID: ' || COALESCE(auth.uid()::text, 'NULL') || E'\n';
    result := result || 'Current User Role: ' || COALESCE(current_role, 'NULL') || E'\n';
    result := result || 'Is Admin: ' || is_admin_user::text || E'\n' || E'\n';
    
    -- 전체 프로필 수 및 강사 수 확인
    SELECT COUNT(*) INTO total_profiles FROM public.profiles;
    SELECT COUNT(*) INTO instructor_count FROM public.profiles WHERE role = 'instructor';
    
    -- 다른 사용자 프로필 접근 가능 수 확인
    SELECT COUNT(*) INTO profile_access_count 
    FROM public.profiles 
    WHERE id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000001');
    
    result := result || '👥 Total Profiles: ' || total_profiles::text || E'\n';
    result := result || '👨‍🏫 Instructors: ' || instructor_count::text || E'\n';
    result := result || '👁️ Other Users Profiles Accessible: ' || profile_access_count::text;
    
    IF NOT is_admin_user AND profile_access_count > instructor_count THEN
        result := result || ' ⚠️ SECURITY ISSUE!';
    ELSE
        result := result || ' ✅ OK';
    END IF;
    
    result := result || E'\n';
    
    -- 다른 사용자 수강정보 접근 가능 수 확인
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
    result := result || '⚡ 빠른 체크: SELECT public.security_quick_check();' || E'\n';
    result := result || 'ℹ️ 사용자 역할: SELECT public.get_user_role_safe();';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. 콘솔에서 쉽게 사용할 수 있는 단축 함수
CREATE OR REPLACE FUNCTION public.check_security()
RETURNS text AS $$
BEGIN
    RETURN public.security_quick_check();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. 권한 부여
GRANT EXECUTE ON FUNCTION public.get_user_role_safe(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_instructor_safe(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.test_rls_security() TO authenticated;
GRANT EXECUTE ON FUNCTION public.security_quick_check() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_security() TO authenticated, anon;

-- 6. 함수 설명 추가
COMMENT ON FUNCTION public.get_user_role_safe(uuid) IS '안전한 사용자 역할 확인 함수';
COMMENT ON FUNCTION public.is_instructor_safe(uuid) IS '강사 권한 확인 함수';
COMMENT ON FUNCTION public.test_rls_security() IS 'RLS 보안 정책 종합 테스트 함수 - 테이블 형태로 결과 반환';
COMMENT ON FUNCTION public.security_quick_check() IS 'RLS 보안 상태 빠른 체크 함수 - 텍스트 형태로 결과 반환';
COMMENT ON FUNCTION public.check_security() IS '보안 상태 체크 단축 함수 (콘솔용)';