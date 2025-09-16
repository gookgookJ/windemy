-- Remove scheduled publishing functionality
ALTER TABLE homepage_sections 
DROP COLUMN IF EXISTS scheduled_publish_at;

-- Remove the scheduled publishing function
DROP FUNCTION IF EXISTS publish_scheduled_sections();

-- Remove the cron job
SELECT cron.unschedule('publish-scheduled-sections');