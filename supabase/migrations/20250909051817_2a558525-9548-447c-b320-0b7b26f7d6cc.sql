-- Create storage buckets for course files
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('course-thumbnails', 'course-thumbnails', true),
  ('course-detail-images', 'course-detail-images', true),
  ('course-files', 'course-files', false);

-- Create storage policies for course thumbnails (public)
CREATE POLICY "Course thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Admins and instructors can upload course thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-thumbnails' AND
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  ))
);

CREATE POLICY "Admins and instructors can update course thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-thumbnails' AND
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  ))
);

-- Create storage policies for course detail images (public)
CREATE POLICY "Course detail images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-detail-images');

CREATE POLICY "Admins and instructors can upload course detail images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-detail-images' AND
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  ))
);

CREATE POLICY "Admins and instructors can update course detail images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-detail-images' AND
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  ))
);

-- Create storage policies for course files (private)
CREATE POLICY "Course files are viewable by enrolled users"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-files' AND
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM enrollments
    JOIN courses ON courses.id = enrollments.course_id
    WHERE enrollments.user_id = auth.uid()
    AND courses.id::text = (storage.foldername(name))[1]
  ))
);

CREATE POLICY "Admins and instructors can upload course files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-files' AND
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  ))
);

CREATE POLICY "Admins and instructors can update course files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-files' AND
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  ))
);

-- Add attachment columns to course_sessions for file uploads
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS attachment_name TEXT;