-- Drop the existing CHECK constraint on course_type
ALTER TABLE public.courses 
DROP CONSTRAINT IF EXISTS courses_course_type_check;

-- Add new CHECK constraint with '실시간 라이브' included
ALTER TABLE public.courses 
ADD CONSTRAINT courses_course_type_check 
CHECK (course_type IN ('VOD', '실시간 라이브', '오프라인', '1:1 컨설팅', '챌린지·스터디'));