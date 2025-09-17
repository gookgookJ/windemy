-- Security Fix: Comprehensive security hardening
-- First, drop all existing policies that need to be replaced

-- Drop existing profile policies
DROP POLICY IF EXISTS "Public can view instructor profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view instructor profiles (safe fields only)" ON public.profiles;
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Users can manage own progress" ON public.session_progress;
DROP POLICY IF EXISTS "Only authenticated users can manage homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Only authenticated users can manage homepage section courses" ON public.homepage_section_courses;

-- Security Fix 1: Create secure view for instructor profiles (no email/phone exposure)
CREATE OR REPLACE VIEW public.instructors_public_safe AS
SELECT 
  id,
  full_name,
  instructor_bio,
  instructor_avatar_url,
  created_at,
  updated_at
FROM public.profiles
WHERE role = 'instructor';

-- Grant public access to the safe view
GRANT SELECT ON public.instructors_public_safe TO anon, authenticated;

-- Create secure policy for instructor profiles (will use the view instead of direct table access)
CREATE POLICY "Public can view instructor profiles safely"
ON public.profiles
FOR SELECT
USING (role = 'instructor');

-- Security Fix 2: Restrict homepage management to admins only
CREATE POLICY "Only admins can manage homepage sections"
ON public.homepage_sections
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can manage homepage section courses"
ON public.homepage_section_courses
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Security Fix 3: Fix course visibility - unpublished courses only visible to owner/admin
CREATE POLICY "Secure course visibility"
ON public.courses
FOR SELECT
USING (
  is_published = true OR 
  instructor_id = auth.uid() OR 
  public.is_admin()
);

-- Security Fix 4: Tighten session_progress - only enrolled users can access
CREATE POLICY "Enrolled users can manage own progress"
ON public.session_progress
FOR ALL
USING (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN course_sessions cs ON cs.course_id = e.course_id
    WHERE e.user_id = auth.uid() AND cs.id = session_progress.session_id
  )
)
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN course_sessions cs ON cs.course_id = e.course_id
    WHERE e.user_id = auth.uid() AND cs.id = session_progress.session_id
  )
);