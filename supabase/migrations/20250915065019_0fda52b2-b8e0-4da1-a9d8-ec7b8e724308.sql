-- 1. course-files 스토리지 버킷 생성 (이미 있을 수 있음)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-files', 'course-files', false)
ON CONFLICT (id) DO NOTHING;

-- 2. course-files 버킷에 대한 RLS 정책 생성
-- 관리자는 모든 파일에 접근 가능
CREATE POLICY "Admins can access all course files"
ON storage.objects
FOR ALL
USING (bucket_id = 'course-files' AND auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

-- 3. 수강한 학생들은 해당 강의의 파일만 다운로드 가능
CREATE POLICY "Students can download course files they are enrolled in"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'course-files' 
  AND auth.uid() IN (
    SELECT e.user_id 
    FROM enrollments e
    JOIN course_sessions cs ON cs.course_id = e.course_id
    WHERE cs.attachment_url LIKE '%' || storage.objects.name || '%'
  )
);

-- 4. 강사는 자신의 강의 파일에 접근 가능
CREATE POLICY "Instructors can access their course files"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'course-files' 
  AND auth.uid() IN (
    SELECT c.instructor_id 
    FROM courses c
    JOIN course_sessions cs ON cs.course_id = c.id
    WHERE cs.attachment_url LIKE '%' || storage.objects.name || '%'
  )
);

-- 5. 세션 자료 다운로드 로그 테이블 생성
CREATE TABLE IF NOT EXISTS public.session_file_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. RLS 활성화
ALTER TABLE public.session_file_downloads ENABLE ROW LEVEL SECURITY;

-- 7. 다운로드 로그 정책
CREATE POLICY "Users can view their own download logs"
ON public.session_file_downloads
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert download logs"
ON public.session_file_downloads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 8. 관리자는 모든 다운로드 로그 확인 가능
CREATE POLICY "Admins can view all download logs"
ON public.session_file_downloads
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  )
);

-- 9. 자동 timestamp 업데이트 함수 (없다면 생성)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;