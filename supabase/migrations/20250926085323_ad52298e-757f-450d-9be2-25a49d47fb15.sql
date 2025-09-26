-- Add course_type column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type TEXT NOT NULL DEFAULT 'VOD';

-- Create a constraint to ensure only valid course types
ALTER TABLE courses ADD CONSTRAINT courses_course_type_check CHECK (course_type IN ('VOD', '오프라인', '1:1 컨설팅', '챌린지·스터디'));

-- Update all existing courses to VOD type
UPDATE courses SET course_type = 'VOD';