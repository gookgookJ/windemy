-- 새로운 instructors 테이블 생성 (auth.users와 독립적)
CREATE TABLE public.instructors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  instructor_bio TEXT,
  instructor_avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정
CREATE POLICY "Instructors viewable by everyone"
ON public.instructors FOR SELECT
USING (true);

CREATE POLICY "Admins can manage instructors"
ON public.instructors FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 기존 profiles 테이블의 강사 데이터를 새 테이블로 마이그레이션
INSERT INTO public.instructors (email, full_name, instructor_bio, instructor_avatar_url, created_at, updated_at)
SELECT 
  email, 
  full_name, 
  instructor_bio, 
  instructor_avatar_url, 
  created_at, 
  updated_at
FROM public.profiles 
WHERE role = 'instructor';

-- updated_at 트리거 추가
CREATE TRIGGER update_instructors_updated_at
BEFORE UPDATE ON public.instructors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();