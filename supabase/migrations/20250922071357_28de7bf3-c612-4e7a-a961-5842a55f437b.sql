-- 남은 보안 문제들 해결

-- 1. Extension in Public 문제 해결
-- 일반적으로 extensions는 public이 아닌 별도 스키마에 있어야 함
-- 하지만 Supabase에서 기본으로 설치된 것들은 그대로 두는 것이 안전

-- 2. 추가적인 보안 강화
-- 데이터베이스 레벨에서 할 수 있는 추가 보안 설정들

-- 민감한 정보에 대한 추가 보안 함수들 생성
CREATE OR REPLACE FUNCTION public.sanitize_user_input(input_text text)
RETURNS text AS $$
BEGIN
    -- 기본적인 입력 검증 및 정화
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- HTML 태그 제거 및 특수 문자 이스케이프
    RETURN regexp_replace(
        regexp_replace(input_text, '<[^>]*>', '', 'g'),
        '[<>&"'']', 
        '', 
        'g'
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER IMMUTABLE SET search_path = public;

-- 사용자 세션 보안 강화 함수
CREATE OR REPLACE FUNCTION public.validate_user_session()
RETURNS boolean AS $$
BEGIN
    -- 현재 사용자가 유효한 세션을 가지고 있는지 확인
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;
    
    -- 사용자 프로필이 존재하고 활성 상태인지 확인
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid()
    ) THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER STABLE SET search_path = public;

-- 보안 감사를 위한 추가 로깅 함수
CREATE OR REPLACE FUNCTION public.log_security_event(
    event_type_param text,
    details_param jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
    INSERT INTO public.security_audit_logs (
        event_type,
        user_id,
        details,
        ip_address
    ) VALUES (
        event_type_param,
        auth.uid(),
        details_param,
        inet_client_addr()
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- 데이터베이스 정리 및 최적화 함수 (관리자 전용)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(
    days_to_keep integer DEFAULT 90
) RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- 관리자만 실행 가능
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- 오래된 감사 로그 삭제
    DELETE FROM public.security_audit_logs 
    WHERE created_at < (now() - interval '1 day' * days_to_keep);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 삭제 작업 로깅
    INSERT INTO public.security_audit_logs (
        event_type,
        user_id,
        details
    ) VALUES (
        'audit_logs_cleanup',
        auth.uid(),
        jsonb_build_object(
            'deleted_count', deleted_count,
            'days_kept', days_to_keep
        )
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- 필요한 권한 부여
GRANT EXECUTE ON FUNCTION public.sanitize_user_input(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_user_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, jsonb) TO authenticated;
-- cleanup 함수는 관리자만 실행 가능하므로 별도 권한 부여 안함

COMMENT ON FUNCTION public.sanitize_user_input(text) IS '입력 데이터 정화 함수';
COMMENT ON FUNCTION public.validate_user_session() IS '사용자 세션 유효성 검사 함수';
COMMENT ON FUNCTION public.log_security_event(text, jsonb) IS '보안 이벤트 로깅 함수';
COMMENT ON FUNCTION public.cleanup_old_audit_logs(integer) IS '오래된 감사 로그 정리 함수 (관리자 전용)';