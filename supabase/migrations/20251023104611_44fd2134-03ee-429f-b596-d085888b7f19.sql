-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule blog posts update every day at 10:00 AM KST (01:00 UTC, considering KST is UTC+9)
SELECT cron.schedule(
  'update-blog-posts-daily',
  '0 1 * * *', -- 01:00 UTC = 10:00 KST
  $$
  SELECT
    net.http_post(
        url:='https://hzeoergmlzhdorhgzehz.supabase.co/functions/v1/update-blog-posts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZW9lcmdtbHpoZG9yaGd6ZWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNDQ4OTcsImV4cCI6MjA3MjYyMDg5N30.EeTNyJENiH3OQGXb5p-P-RzuadAgDYdGtk7qBEnsprs"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);