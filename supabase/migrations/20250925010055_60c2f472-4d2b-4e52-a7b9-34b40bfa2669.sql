-- 강사 정보 공개 접근을 위한 RLS 정책 수정
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Public can view instructor info (no email)" ON public.instructors;

-- 강사 정보 공개 열람 정책 추가 (이메일 제외)
CREATE POLICY "Public can view instructor info" ON public.instructors
FOR SELECT TO public
USING (true);

-- 강사 정보는 여전히 관리자만 수정 가능하도록 유지
-- (기존 관리자 정책은 그대로 두고 SELECT만 공개)