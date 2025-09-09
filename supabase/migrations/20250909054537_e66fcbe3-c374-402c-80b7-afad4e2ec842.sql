-- Add storage policies with IF NOT EXISTS using DO blocks

-- Thumbnails: public read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read thumbnails'
  ) THEN
    CREATE POLICY "Public read thumbnails"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'course-thumbnails');
  END IF;
END$$;

-- Thumbnails: auth write
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Auth write thumbnails'
  ) THEN
    CREATE POLICY "Auth write thumbnails"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);
  END IF;
END$$;

-- Thumbnails: auth update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Auth update thumbnails'
  ) THEN
    CREATE POLICY "Auth update thumbnails"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);
  END IF;
END$$;

-- Thumbnails: auth delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Auth delete thumbnails'
  ) THEN
    CREATE POLICY "Auth delete thumbnails"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);
  END IF;
END$$;

-- Detail images: public read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read detail images'
  ) THEN
    CREATE POLICY "Public read detail images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'course-detail-images');
  END IF;
END$$;

-- Detail images: auth write
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Auth write detail images'
  ) THEN
    CREATE POLICY "Auth write detail images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);
  END IF;
END$$;

-- Detail images: auth update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Auth update detail images'
  ) THEN
    CREATE POLICY "Auth update detail images"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);
  END IF;
END$$;

-- Detail images: auth delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Auth delete detail images'
  ) THEN
    CREATE POLICY "Auth delete detail images"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'course-detail-images' AND auth.uid() IS NOT NULL);
  END IF;
END$$;