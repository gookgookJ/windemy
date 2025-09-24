-- cron job을 위한 pg_cron과 pg_net 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 매일 오전 10시(한국시간 오전 1시 UTC)에 블로그 포스트 업데이트 자동 실행
SELECT cron.schedule(
  'update-blog-posts-daily',
  '0 1 * * *', -- 매일 오전 1시 UTC (한국 오전 10시)
  $$
  SELECT
    net.http_post(
        url:='https://hzeoergmlzhdorhgzehz.supabase.co/functions/v1/update-blog-posts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZW9lcmdtbHpoZG9yaGd6ZWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNDQ4OTcsImV4cCI6MjA3MjYyMDg5N30.EeTNyJENiH3OQGXb5p-P-RzuadAgDYdGtk7qBEnsprs"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);