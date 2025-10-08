-- Phase 3: Add RLS policies to user_activity_stats and create data retention policy

-- Enable RLS on user_activity_stats view (materialized view doesn't support RLS, so we treat it as a regular view)
-- Note: user_activity_stats is a VIEW, not a table, so RLS policies won't work directly
-- Instead, we'll create a security definer function to access it safely

-- Create a safe function to access user activity stats
CREATE OR REPLACE FUNCTION public.get_user_activity_stats_safe(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  user_id uuid,
  total_activities bigint,
  active_days bigint,
  last_activity timestamp with time zone,
  action_types text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_activity_stats.user_id,
    user_activity_stats.total_activities,
    user_activity_stats.active_days,
    user_activity_stats.last_activity,
    user_activity_stats.action_types
  FROM user_activity_stats
  WHERE user_activity_stats.user_id = COALESCE(target_user_id, auth.uid())
    OR public.is_admin();
$$;

-- Create a function to clean up old activity logs (data retention policy)
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs(days_to_keep integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Only admins can execute this
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Delete old activity logs
    DELETE FROM public.activity_logs 
    WHERE created_at < (now() - interval '1 day' * days_to_keep);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup action
    INSERT INTO public.security_audit_logs (
        event_type,
        user_id,
        details
    ) VALUES (
        'activity_logs_cleanup',
        auth.uid(),
        jsonb_build_object(
            'deleted_count', deleted_count,
            'days_kept', days_to_keep
        )
    );
    
    RETURN deleted_count;
END;
$$;

-- Add comment explaining the data retention policy
COMMENT ON FUNCTION public.cleanup_old_activity_logs IS 
'Deletes activity logs older than specified days. Default is 90 days. Only admins can execute this function. Use in a scheduled job for automatic cleanup.';