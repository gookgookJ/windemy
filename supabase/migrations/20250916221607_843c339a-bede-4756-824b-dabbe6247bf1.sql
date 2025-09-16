-- Add draft/published system back with scheduling
ALTER TABLE homepage_sections 
ADD COLUMN is_draft boolean DEFAULT false,
ADD COLUMN published_at timestamp with time zone,
ADD COLUMN scheduled_publish_at timestamp with time zone;

ALTER TABLE homepage_section_courses 
ADD COLUMN is_draft boolean DEFAULT false;

-- Create function to publish scheduled sections
CREATE OR REPLACE FUNCTION publish_scheduled_sections()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get sections that should be published now
  UPDATE homepage_sections 
  SET 
    is_draft = false,
    published_at = now(),
    scheduled_publish_at = null
  WHERE 
    is_draft = true 
    AND scheduled_publish_at <= now()
    AND scheduled_publish_at IS NOT NULL;

  -- Update corresponding section courses
  UPDATE homepage_section_courses
  SET is_draft = false
  WHERE section_id IN (
    SELECT id FROM homepage_sections 
    WHERE is_draft = false AND published_at >= now() - INTERVAL '1 minute'
  );
END;
$$;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every minute
SELECT cron.schedule(
  'publish-scheduled-sections',
  '* * * * *',
  'SELECT publish_scheduled_sections();'
);