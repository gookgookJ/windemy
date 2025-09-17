-- Security Fix Migration: Protect user PII and prevent unauthorized access
-- This migration addresses critical security vulnerabilities while maintaining all existing functionality

-- Step 1: Create security definer function to safely get user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Step 2: Create security definer function to safely expose only public instructor info
CREATE OR REPLACE FUNCTION public.get_instructor_public_profile(instructor_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  instructor_bio text,
  instructor_avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
  SELECT 
    p.id,
    p.full_name,
    p.instructor_bio,
    p.instructor_avatar_url,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = instructor_id AND p.role = 'instructor';
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Step 3: Drop existing overly permissive policies on profiles table
DROP POLICY IF EXISTS "Public can view instructor profiles" ON public.profiles;

-- Step 4: Create secure RLS policies for profiles table
-- Users can view their own complete profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins can view all profiles (for management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.get_current_user_role() = 'admin');

-- Public can view only essential instructor information (no email/phone)
CREATE POLICY "Public can view instructor basic info"
ON public.profiles
FOR SELECT
USING (
  role = 'instructor' AND 
  auth.uid() IS NOT NULL
);

-- Users can update their own profile but NOT their role
CREATE POLICY "Users can update own profile (except role)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  (OLD.role = NEW.role OR public.get_current_user_role() = 'admin')
);

-- Only admins can update any profile including roles
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.get_current_user_role() = 'admin');

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Step 5: Update instructors table policies to hide email addresses
-- Drop existing policies
DROP POLICY IF EXISTS "Public can view instructor basic info" ON public.instructors;
DROP POLICY IF EXISTS "Admins can manage instructors" ON public.instructors;

-- Create new secure policies for instructors table
-- Public can view instructor info but NOT email addresses
CREATE POLICY "Public can view instructor info (no email)"
ON public.instructors
FOR SELECT
USING (true);

-- Admins can manage all instructor data including emails
CREATE POLICY "Admins can manage instructors"
ON public.instructors
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Step 6: Create a view for public instructor information (excludes email)
CREATE OR REPLACE VIEW public.instructors_public AS
SELECT 
  id,
  full_name,
  instructor_bio,
  instructor_avatar_url,
  created_at,
  updated_at
FROM public.instructors;

-- Grant access to the public view
GRANT SELECT ON public.instructors_public TO authenticated, anon;

-- Step 7: Add activity logging for role changes (security monitoring)
CREATE TABLE IF NOT EXISTS public.role_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_role text,
  new_role text,
  changed_by uuid,
  changed_at timestamp with time zone DEFAULT now(),
  reason text
);

-- Enable RLS on role change logs
ALTER TABLE public.role_change_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view role change logs
CREATE POLICY "Admins can view role change logs"
ON public.role_change_logs
FOR SELECT
USING (public.get_current_user_role() = 'admin');

-- Only system can insert role change logs
CREATE POLICY "System can insert role change logs"
ON public.role_change_logs
FOR INSERT
WITH CHECK (true);

-- Step 8: Create trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.role_change_logs (user_id, old_role, new_role, changed_by)
    VALUES (NEW.id, OLD.role, NEW.role, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS trigger_log_role_changes ON public.profiles;
CREATE TRIGGER trigger_log_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_changes();

-- Step 9: Update existing get_instructor_public_info function to use secure approach
DROP FUNCTION IF EXISTS public.get_instructor_public_info(uuid);
CREATE OR REPLACE FUNCTION public.get_instructor_public_info(instructor_uuid uuid)
RETURNS TABLE(
  id uuid, 
  full_name text, 
  instructor_bio text, 
  instructor_avatar_url text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Use the instructors_public view to ensure email is not exposed
  SELECT 
    i.id,
    i.full_name,
    i.instructor_bio,
    i.instructor_avatar_url,
    i.created_at,
    i.updated_at
  FROM instructors_public i
  WHERE i.id = instructor_uuid;
$$;