-- Add missing columns to courses table for detailed course information
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS what_you_will_learn TEXT[],
ADD COLUMN IF NOT EXISTS requirements TEXT[],
ADD COLUMN IF NOT EXISTS thumbnail_path TEXT,
ADD COLUMN IF NOT EXISTS detail_image_path TEXT;

-- Create course_options table for different pricing tiers (if not exists)
CREATE TABLE IF NOT EXISTS course_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  benefits TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on course_options only if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'course_options' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE course_options ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Update course_sessions to include more detailed information
ALTER TABLE course_sessions 
ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT false;