-- RLS 보안 정책 완전 재구성 (기존 함수 보존)

-- 1. 기존 문제가 있는 정책들만 삭제하고 새로운 정책 생성
DROP POLICY IF EXISTS "Enhanced profile security" ON public.profiles;
DROP POLICY IF EXISTS "Public can view instructor profiles (safe fields only)" ON public.profiles;
DROP POLICY IF EXISTS "Public instructor view access" ON public.profiles;
DROP POLICY IF EXISTS "Own profile access only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin can update any" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

-- enrollments 정책 삭제
DROP POLICY IF EXISTS "Enhanced enrollment security" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can create own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Instructors can view course enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments (all)" ON public.enrollments;

-- session_progress 정책 삭제  
DROP POLICY IF EXISTS "Enhanced progress security" ON public.session_progress;
DROP POLICY IF EXISTS "Enrolled users can manage own progress" ON public.session_progress;
DROP POLICY IF EXISTS "Users can manage own progress for enrolled courses" ON public.session_progress;

-- 2. 추가 보안 함수들 (기존 is_admin 함수는 유지)
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

-- 3. profiles 테이블 보안 정책 재구성
CREATE POLICY "profiles_select_secure" ON public.profiles
    FOR SELECT USING (
        id = auth.uid() OR 
        is_admin() OR
        (role = 'instructor' AND auth.role() = 'authenticated')
    );

CREATE POLICY "profiles_insert_secure" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_secure" ON public.profiles
    FOR UPDATE USING (
        id = auth.uid() OR is_admin()
    ) WITH CHECK (
        id = auth.uid() OR is_admin()
    );

CREATE POLICY "profiles_delete_secure" ON public.profiles
    FOR DELETE USING (is_admin());

-- 4. enrollments 테이블 보안 정책 재구성
CREATE POLICY "enrollments_select_secure" ON public.enrollments
    FOR SELECT USING (
        user_id = auth.uid() OR 
        is_admin() OR
        EXISTS (
            SELECT 1 FROM public.courses c 
            WHERE c.id = enrollments.course_id 
            AND c.instructor_id = auth.uid()
        )
    );

CREATE POLICY "enrollments_insert_secure" ON public.enrollments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "enrollments_update_secure" ON public.enrollments
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    ) WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "enrollments_delete_secure" ON public.enrollments
    FOR DELETE USING (is_admin());

-- 5. session_progress 테이블 보안 정책 재구성
CREATE POLICY "session_progress_select_secure" ON public.session_progress
    FOR SELECT USING (
        user_id = auth.uid() OR 
        is_admin() OR
        EXISTS (
            SELECT 1 FROM public.course_sessions cs
            JOIN public.courses c ON c.id = cs.course_id
            WHERE cs.id = session_progress.session_id 
            AND c.instructor_id = auth.uid()
        )
    );

CREATE POLICY "session_progress_insert_secure" ON public.session_progress
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.course_sessions cs ON cs.course_id = e.course_id
            WHERE e.user_id = auth.uid() 
            AND cs.id = session_progress.session_id
        )
    );

CREATE POLICY "session_progress_update_secure" ON public.session_progress
    FOR UPDATE USING (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.course_sessions cs ON cs.course_id = e.course_id
            WHERE e.user_id = auth.uid() 
            AND cs.id = session_progress.session_id
        )
    ) WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.course_sessions cs ON cs.course_id = e.course_id
            WHERE e.user_id = auth.uid() 
            AND cs.id = session_progress.session_id
        )
    );

-- 6. 보안 테스트 함수들
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

    -- profiles 테이블 접근 테스트 (다른 사용자 프로필)
    SELECT COUNT(*) INTO profile_count 
    FROM public.profiles 
    WHERE id != COALESCE(current_user_id, test_user_id);
    
    RETURN QUERY SELECT 
        'Other Users Profiles Access'::text,
        'profiles'::text,
        CASE WHEN is_admin() THEN 'Should see all profiles' ELSE 'Should see only instructors' END::text,
        profile_count::text,
        CASE 
            WHEN is_admin() THEN 'PASS'
            WHEN profile_count <= (SELECT COUNT(*) FROM public.profiles WHERE role = 'instructor') THEN 'PASS'
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

-- 7. 빠른 보안 체크 함수 (콘솔용)
CREATE OR REPLACE FUNCTION public.security_quick_check()
RETURNS text AS $$
DECLARE
    result text := '';
    current_role text := public.get_user_role_safe();
    is_admin_user boolean := is_admin();
    profile_access_count integer;
    enrollment_access_count integer;
    instructor_count integer;
BEGIN
    result := result || '=== RLS 보안 상태 체크 ===' || E'\n';
    result := result || 'Current User ID: ' || COALESCE(auth.uid()::text, 'NULL') || E'\n';
    result := result || 'Current User Role: ' || COALESCE(current_role, 'NULL') || E'\n';
    result := result || 'Is Admin: ' || is_admin_user::text || E'\n' || E'\n';
    
    -- 강사 프로필 수 확인
    SELECT COUNT(*) INTO instructor_count FROM public.profiles WHERE role = 'instructor';
    
    -- 다른 사용자 프로필 접근 가능 수 확인
    SELECT COUNT(*) INTO profile_access_count 
    FROM public.profiles 
    WHERE id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000001');
    
    result := result || 'Other Users Profiles Accessible: ' || profile_access_count::text;
    result := result || ' (Instructors: ' || instructor_count::text || ')';
    
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
    
    result := result || 'Other Users Enrollments Accessible: ' || enrollment_access_count::text;
    
    IF NOT is_admin_user AND enrollment_access_count > 0 THEN
        result := result || ' ⚠️ SECURITY ISSUE!';
    ELSE
        result := result || ' ✅ OK';
    END IF;
    
    result := result || E'\n' || E'\n';
    result := result || '💡 보안 테스트: SELECT * FROM public.test_rls_security();';
    result := result || E'\n';
    result := result || '💡 빠른 체크: SELECT public.security_quick_check();';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. 권한 부여
GRANT EXECUTE ON FUNCTION public.get_user_role_safe(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_instructor_safe(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.test_rls_security() TO authenticated;
GRANT EXECUTE ON FUNCTION public.security_quick_check() TO authenticated, anon;

COMMENT ON FUNCTION public.test_rls_security() IS 'RLS 보안 정책 종합 테스트 함수';
COMMENT ON FUNCTION public.security_quick_check() IS 'RLS 보안 상태 빠른 체크 함수 (콘솔용)';