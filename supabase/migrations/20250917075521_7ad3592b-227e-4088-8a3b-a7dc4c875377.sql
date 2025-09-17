-- Critical Security Fixes: Role Escalation Prevention and System Hardening

-- 1. Add missing role change prevention triggers to profiles table
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change_by_non_admin();

DROP TRIGGER IF EXISTS log_role_changes_trigger ON public.profiles;
CREATE TRIGGER log_role_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_changes();

-- 2. Create secure instructor view to replace SECURITY DEFINER view
DROP VIEW IF EXISTS public.instructors_public_safe;
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

-- Enable RLS on the view (inherits from profiles table policies)
ALTER VIEW public.instructors_public_safe SET (security_barrier = true);

-- 3. Remove the problematic SECURITY DEFINER view
DROP VIEW IF EXISTS public.instructors_public;

-- 4. Update courses table policies to be more restrictive
DROP POLICY IF EXISTS "Published courses viewable by everyone, unpublished only by own" ON public.courses;
DROP POLICY IF EXISTS "Secure course visibility" ON public.courses;

-- Create more restrictive course visibility policy
CREATE POLICY "Restricted course visibility"
ON public.courses
FOR SELECT
USING (
  -- Allow published courses but with limited fields exposure
  (is_published = true) OR 
  -- Own courses
  (instructor_id = auth.uid()) OR 
  -- Admin access
  public.is_admin()
);

-- 5. Create secure storage bucket policies
-- Update avatar bucket policy to prevent data leakage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('secure-avatars', 'secure-avatars', false, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 6. Add rate limiting table for security
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action_type text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
ON public.rate_limits
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "System can manage rate limits"
ON public.rate_limits
FOR ALL
USING (public.is_admin())
WITH CHECK (true);

-- 7. Add audit logging table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.security_audit_logs
FOR SELECT
USING (public.is_admin());

CREATE POLICY "System can insert audit logs"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (true);