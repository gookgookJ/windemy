-- Storage RLS policies for uploads
-- Thumbnails (public read, auth write)
CREATE POLICY IF NOT EXISTS "Public read thumbnails"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-thumbnails');

CREATE POLICY IF NOT EXISTS "Auth write thumbnails"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Auth update thumbnails"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Auth delete thumbnails"
ON storage.objects
FOR DELETE
USING (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);

-- Detail images (public read, auth write)
CREATE POLICY IF NOT EXISTS "Public read detail images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-detail-images');

CREATE POLICY IF NOT EXISTS "Auth write detail images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Auth update detail images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Auth delete detail images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);