-- Add tags column to courses table to support tag management
ALTER TABLE public.courses 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.courses.tags IS 'Array of promotional tags like 신규, 인기, 30명한정, 얼리버드 (max 3)';

-- Create index for better performance when filtering by tags
CREATE INDEX idx_courses_tags ON public.courses USING GIN(tags);