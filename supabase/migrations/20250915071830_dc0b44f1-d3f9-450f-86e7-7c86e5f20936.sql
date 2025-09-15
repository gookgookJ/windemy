-- 섹션에 첨부파일 컬럼 추가
ALTER TABLE course_sections 
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_name TEXT;

-- 세션에서 첨부파일 컬럼 제거
ALTER TABLE course_sessions 
DROP COLUMN IF EXISTS attachment_url,
DROP COLUMN IF EXISTS attachment_name;