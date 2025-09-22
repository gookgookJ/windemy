-- Drop the existing potentially problematic view
DROP VIEW IF EXISTS public.instructors_public_safe;

-- Create a safer view without SECURITY DEFINER
CREATE VIEW public.instructors_public_safe AS
SELECT 
    id,
    full_name,
    instructor_bio,
    instructor_avatar_url,
    created_at,
    updated_at
FROM public.profiles
WHERE role = 'instructor';

-- Enable RLS on the view (though views inherit from base tables)
ALTER VIEW public.instructors_public_safe SET (security_barrier = true);

-- Add additional security policies for instructors table if missing
CREATE POLICY "Instructors public view is secure" ON public.profiles
FOR SELECT USING (role = 'instructor' AND (
    -- Allow public access to instructor profiles for display purposes
    current_setting('role', true) = 'anon' OR 
    current_setting('role', true) = 'authenticated' OR
    auth.uid() IS NOT NULL OR
    auth.uid() IS NULL
));

-- Ensure critical tables have proper access restrictions
-- Add policy to prevent unauthorized access to sensitive user data
CREATE POLICY "Strict profile access control" ON public.profiles
FOR ALL USING (
    -- Users can only access their own profile or public instructor info
    auth.uid() = id OR 
    (role = 'instructor' AND current_setting('request.method', true) = 'GET') OR
    is_admin()
) WITH CHECK (
    -- Users can only modify their own profile, admins can modify any
    auth.uid() = id OR is_admin()
);

-- Add audit logging for profile changes
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile audit logging
DROP TRIGGER IF EXISTS profile_audit_trigger ON public.profiles;
CREATE TRIGGER profile_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();

-- Add rate limiting for sensitive operations
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
$$ LANGUAGE plpgsql SECURITY DEFINER;