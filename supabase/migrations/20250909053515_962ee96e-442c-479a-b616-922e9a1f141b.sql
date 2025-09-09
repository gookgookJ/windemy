-- Create storage buckets for course files
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('course-thumbnails', 'course-thumbnails', true),
  ('course-detail-images', 'course-detail-images', true),
  ('course-attachments', 'course-attachments', false);

-- Create policies for course thumbnails
CREATE POLICY "Course thumbnails are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Authenticated users can upload course thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update course thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete course thumbnails" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);

-- Create policies for course detail images
CREATE POLICY "Course detail images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-detail-images');

CREATE POLICY "Authenticated users can upload course detail images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update course detail images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete course detail images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);

-- Create policies for course attachments
CREATE POLICY "Authenticated users can view course attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload course attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'course-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update course attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'course-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete course attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'course-attachments' AND auth.uid() IS NOT NULL);

-- Create table for course detail images with ordering
CREATE TABLE course_detail_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_name text,
  order_index integer NOT NULL DEFAULT 0,
  section_title text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE course_detail_images ENABLE ROW LEVEL SECURITY;

-- Create policies for course detail images table
CREATE POLICY "Course detail images are viewable by everyone" 
ON course_detail_images 
FOR SELECT 
USING (true);

CREATE POLICY "Instructors can manage own course detail images" 
ON course_detail_images 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_detail_images.course_id 
    AND (courses.instructor_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
  )
);

-- Create index for better performance
CREATE INDEX idx_course_detail_images_course_id ON course_detail_images(course_id);
CREATE INDEX idx_course_detail_images_order ON course_detail_images(course_id, order_index);