-- Fix SECURITY DEFINER functions - only keep it where absolutely necessary
-- These functions NEED to be SECURITY DEFINER for security purposes:
-- - is_admin(), get_current_user_role() (for RLS policies)
-- - handle_new_user() (for user creation trigger)
-- - log_role_changes(), prevent_role_change_by_non_admin() (for admin security)

-- Functions that should NOT be SECURITY DEFINER:
-- - update_enrollment_progress() (can be SECURITY INVOKER)
-- - log_profile_changes() (can be SECURITY INVOKER) 
-- - check_rate_limit() (can be SECURITY INVOKER)

-- Recreate functions with proper security settings
CREATE OR REPLACE FUNCTION public.update_enrollment_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update enrollment progress when session progress changes
  UPDATE enrollments 
  SET progress = (
    SELECT CASE 
      WHEN COUNT(cs.id) = 0 THEN 0
      ELSE (COUNT(CASE WHEN sp.completed = true THEN 1 END)::float / COUNT(cs.id)::float) * 100
    END
    FROM course_sessions cs
    LEFT JOIN session_progress sp ON cs.id = sp.session_id 
      AND sp.user_id = enrollments.user_id 
    WHERE cs.course_id = enrollments.course_id
  ),
  completed_at = CASE 
    WHEN (
      SELECT COUNT(CASE WHEN sp.completed = true THEN 1 END)::float / COUNT(cs.id)::float * 100
      FROM course_sessions cs
      LEFT JOIN session_progress sp ON cs.id = sp.session_id 
        AND sp.user_id = enrollments.user_id 
      WHERE cs.course_id = enrollments.course_id
    ) >= 100 THEN NOW()
    ELSE NULL
  END
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND course_id = (
      SELECT course_id FROM course_sessions 
      WHERE id = COALESCE(NEW.session_id, OLD.session_id)
    );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Recreate log_profile_changes as SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.security_audit_logs (
        event_type,
        user_id,
        details
    ) VALUES (
        'profile_' || TG_OP,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'table', 'profiles',
            'old_data', to_jsonb(OLD),
            'new_data', to_jsonb(NEW)
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Recreate check_rate_limit as SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    user_uuid uuid,
    action_name text,
    max_requests integer DEFAULT 10,
    window_minutes integer DEFAULT 60
) RETURNS boolean AS $$
DECLARE
    request_count integer;
BEGIN
    -- Clean old entries
    DELETE FROM public.rate_limits 
    WHERE window_start < (now() - interval '1 minute' * window_minutes);
    
    -- Count current requests
    SELECT count INTO request_count
    FROM public.rate_limits
    WHERE user_id = user_uuid 
    AND action_type = action_name
    AND window_start > (now() - interval '1 minute' * window_minutes);
    
    IF request_count >= max_requests THEN
        RETURN false;
    END IF;
    
    -- Log this request
    INSERT INTO public.rate_limits (user_id, action_type)
    VALUES (user_uuid, action_name);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Remove any remaining problematic views or policies
-- Make sure all views are safe
DROP VIEW IF EXISTS public.instructors_public CASCADE;

-- Add comment to document why certain functions remain SECURITY DEFINER
COMMENT ON FUNCTION public.is_admin() IS 'SECURITY DEFINER required for RLS policy execution';
COMMENT ON FUNCTION public.get_current_user_role() IS 'SECURITY DEFINER required for RLS policy execution';
COMMENT ON FUNCTION public.handle_new_user() IS 'SECURITY DEFINER required for auth trigger execution';
COMMENT ON FUNCTION public.log_role_changes() IS 'SECURITY DEFINER required for admin privilege verification';
COMMENT ON FUNCTION public.prevent_role_change_by_non_admin() IS 'SECURITY DEFINER required for admin privilege verification';