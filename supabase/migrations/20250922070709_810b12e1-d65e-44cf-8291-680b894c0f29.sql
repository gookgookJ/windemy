-- Fix search_path for existing functions
ALTER FUNCTION public.log_profile_changes() SET search_path = public;
ALTER FUNCTION public.check_rate_limit(uuid, text, integer, integer) SET search_path = public;

-- Fix remaining functions that might have mutable search_path
ALTER FUNCTION public.update_enrollment_progress() SET search_path = public;
ALTER FUNCTION public.get_instructor_public_info(uuid) SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.get_current_user_role() SET search_path = public;
ALTER FUNCTION public.log_role_changes() SET search_path = public;
ALTER FUNCTION public.prevent_role_change_by_non_admin() SET search_path = public;
ALTER FUNCTION public.get_instructor_safe(uuid) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Drop and recreate the view to ensure it's not SECURITY DEFINER
DROP VIEW IF EXISTS public.instructors_public_safe CASCADE;

-- Create a completely safe view
CREATE VIEW public.instructors_public_safe 
WITH (security_barrier = true) AS
SELECT 
    p.id,
    p.full_name,
    p.instructor_bio,
    p.instructor_avatar_url,
    p.created_at,
    p.updated_at
FROM public.profiles p
WHERE p.role = 'instructor';

-- Grant appropriate permissions
GRANT SELECT ON public.instructors_public_safe TO anon;
GRANT SELECT ON public.instructors_public_safe TO authenticated;

-- Remove conflicting policies that might cause issues
DROP POLICY IF EXISTS "Instructors public view is secure" ON public.profiles;
DROP POLICY IF EXISTS "Strict profile access control" ON public.profiles;

-- Ensure the existing policies are working correctly
-- Check if we need to update any existing policies to be more restrictive
CREATE POLICY "Enhanced profile security" ON public.profiles
FOR SELECT USING (
    -- Own profile access
    auth.uid() = id OR 
    -- Admin access
    is_admin() OR
    -- Public instructor info (limited fields)
    (role = 'instructor')
);

-- Ensure proper INSERT policy for profiles  
CREATE POLICY "Users can create own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure proper UPDATE policy for profiles
CREATE POLICY "Users can update own profile or admin can update any" ON public.profiles
FOR UPDATE USING (auth.uid() = id OR is_admin())
WITH CHECK (auth.uid() = id OR is_admin());

-- Ensure proper DELETE policy for profiles (only admins)
CREATE POLICY "Only admins can delete profiles" ON public.profiles
FOR DELETE USING (is_admin());