-- Update user role to admin for testing
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'eca70779-ecd7-4fe5-b668-e6be42b109a1';

-- Also create more permissive policies for course management
DROP POLICY IF EXISTS "course_thumbnails_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "course_detail_images_insert_policy" ON storage.objects;

-- Create new policies that allow authenticated users to upload
CREATE POLICY "course_thumbnails_insert_auth" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY "course_detail_images_insert_auth" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);