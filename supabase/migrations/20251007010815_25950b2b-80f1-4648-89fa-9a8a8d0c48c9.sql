-- Add video_duration_seconds column to course_sessions table
ALTER TABLE public.course_sessions 
ADD COLUMN IF NOT EXISTS video_duration_seconds integer DEFAULT 0;

-- Add comment to describe the column
COMMENT ON COLUMN public.course_sessions.video_duration_seconds IS 'Video duration in seconds from Vimeo API';