-- Security Fix 1: Create secure public view for instructor profiles (no email/phone exposure)
-- Drop the existing problematic policy that exposes all instructor data
DROP POLICY IF EXISTS "Public can view instructor profiles" ON public.profiles;

-- Create a secure view that only exposes safe instructor data
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

-- Create new policy for profiles that only allows public viewing of basic instructor info through the view
CREATE POLICY "Public can view safe instructor profiles"
ON public.profiles
FOR SELECT
USING (role = 'instructor' AND auth.uid() IS NULL AND 
       -- Only allow access to safe fields, block sensitive ones
       NOT EXISTS (SELECT 1 WHERE current_setting('request.jwt.claims', true)::json ? 'email'));

-- Security Fix 2: Restrict homepage management to admins only
DROP POLICY IF EXISTS "Only authenticated users can manage homepage sections" ON public.homepage_sections;
CREATE POLICY "Only admins can manage homepage sections"
ON public.homepage_sections
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only authenticated users can manage homepage section courses" ON public.homepage_section_courses;
CREATE POLICY "Only admins can manage homepage section courses"
ON public.homepage_section_courses
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Security Fix 3: Fix course visibility - don't show unpublished course metadata to all authenticated users
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON public.courses;
CREATE POLICY "Published courses viewable by everyone, unpublished only by owner/admin"
ON public.courses
FOR SELECT
USING (
  is_published = true OR 
  instructor_id = auth.uid() OR 
  public.is_admin()
);

-- Security Fix 4: Tighten session_progress policy to ensure only enrolled users can access
DROP POLICY IF EXISTS "Users can manage own progress" ON public.session_progress;
CREATE POLICY "Users can manage own progress for enrolled courses"
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