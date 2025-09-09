-- Remove existing conflicting policies and create new ones
DROP POLICY IF EXISTS "Course thumbnails are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete course thumbnails" ON storage.objects;

DROP POLICY IF EXISTS "Course detail images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload course detail images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update course detail images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete course detail images" ON storage.objects;

-- Create new policies for course thumbnails
CREATE POLICY "course_thumbnails_select_policy" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-thumbnails');

CREATE POLICY "course_thumbnails_insert_policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "course_thumbnails_update_policy" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "course_thumbnails_delete_policy" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);

-- Create new policies for course detail images
CREATE POLICY "course_detail_images_select_policy" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-detail-images');

CREATE POLICY "course_detail_images_insert_policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "course_detail_images_update_policy" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "course_detail_images_delete_policy" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);

-- Create policies for course attachments
CREATE POLICY "course_attachments_select_policy" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "course_attachments_insert_policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'course-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "course_attachments_update_policy" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'course-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "course_attachments_delete_policy" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'course-attachments' AND auth.uid() IS NOT NULL);