-- 완전히 다른 접근: 뷰를 대체할 함수로 바꿔보기
-- 뷰 대신 SECURITY INVOKER 함수로 대체

DROP VIEW IF EXISTS public.instructors_public_safe CASCADE;

-- 뷰 대신 함수 생성 (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.get_instructors_public()
RETURNS TABLE (
    id uuid,
    full_name text,
    instructor_bio text,
    instructor_avatar_url text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) AS $$
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
    WHERE p.role = 'instructor';
END;
$$ LANGUAGE plpgsql SECURITY INVOKER STABLE SET search_path = public;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.get_instructors_public() TO anon;
GRANT EXECUTE ON FUNCTION public.get_instructors_public() TO authenticated;

-- 만약 정말 뷰가 필요하다면, 이 함수를 기반으로 한 단순한 뷰 생성
-- 하지만 일단 함수만으로 시도해보자

-- 기존에 있을 수 있는 문제가 되는 객체들 정리
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- 혹시 있을 수 있는 다른 instructor 관련 뷰들 제거
    FOR rec IN 
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%instructor%'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || rec.table_name || ' CASCADE';
    END LOOP;
    
    -- 혹시 있을 수 있는 materialized view들도 확인
    FOR rec IN 
        SELECT matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public' 
        AND matviewname LIKE '%instructor%'
    LOOP
        EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS public.' || rec.matviewname || ' CASCADE';
    END LOOP;
END $$;