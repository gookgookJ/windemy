-- Add tag field to course_options for displaying labels like "2차 얼리버드"
ALTER TABLE public.course_options 
ADD COLUMN IF NOT EXISTS tag text;

-- Add thumbnail_url to courses table if not exists
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS thumbnail_url text;