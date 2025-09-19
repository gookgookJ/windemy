-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to run daily at 11:59 AM KST (02:59 UTC)
SELECT cron.schedule(
  'update-blog-posts-daily',
  '59 2 * * *', -- 02:59 UTC = 11:59 KST
  $$
  SELECT
    net.http_post(
        url:='https://hzeoergmlzhdorhgzehz.supabase.co/functions/v1/update-blog-posts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZW9lcmdtbHpoZG9yaGd6ZWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNDQ4OTcsImV4cCI6MjA3MjYyMDg5N30.EeTNyJENiH3OQGXb5p-P-RzuadAgDYdGtk7qBEnsprs"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);