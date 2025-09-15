-- storage 정책들 제거 (course_sessions attachment_url 의존성 제거)
DROP POLICY IF EXISTS "Students can download course files they are enrolled in" ON storage.objects;
DROP POLICY IF EXISTS "Instructors can access their course files" ON storage.objects;

-- 섹션에 첨부파일 컬럼 추가
ALTER TABLE course_sections 
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_name TEXT;

-- 세션에서 첨부파일 컬럼 제거
ALTER TABLE course_sessions 
DROP COLUMN IF EXISTS attachment_url,
DROP COLUMN IF EXISTS attachment_name;

-- 새로운 storage 정책 생성 (섹션 기반)
CREATE POLICY "Students can download section files they are enrolled in"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-files' AND 
  EXISTS (
    SELECT 1 FROM course_sections cs
    JOIN courses c ON c.id = cs.course_id
    JOIN enrollments e ON e.course_id = c.id
    WHERE e.user_id = auth.uid()
    AND cs.attachment_url = name
  )
);

CREATE POLICY "Instructors can access their section files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'course-files' AND 
  EXISTS (
    SELECT 1 FROM course_sections cs
    JOIN courses c ON c.id = cs.course_id
    WHERE c.instructor_id = auth.uid()
    AND cs.attachment_url = name
  )
);

CREATE POLICY "Admins can access all course files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'course-files' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);