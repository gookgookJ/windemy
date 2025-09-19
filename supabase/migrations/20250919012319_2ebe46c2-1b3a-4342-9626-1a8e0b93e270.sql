-- Create a system setting for the blog update cron job
INSERT INTO system_settings (key, value, category, description, is_public)
VALUES (
  'blog_update_cron_job',
  '{"enabled": true, "schedule": "59 11 * * *", "timezone": "Asia/Seoul", "last_run": null}',
  'automation',
  'Settings for the daily blog posts update cron job that runs at 11:59 AM KST',
  false
);

-- Create a table to store blog post update history
CREATE TABLE IF NOT EXISTS blog_update_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posts_fetched INTEGER NOT NULL,
  posts_data JSONB NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the blog update history table
ALTER TABLE blog_update_history ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view blog update history
CREATE POLICY "Admins can view blog update history" 
ON blog_update_history 
FOR SELECT 
USING (is_admin());

-- Create policy for system to insert blog update history
CREATE POLICY "System can insert blog update history" 
ON blog_update_history 
FOR INSERT 
WITH CHECK (true);