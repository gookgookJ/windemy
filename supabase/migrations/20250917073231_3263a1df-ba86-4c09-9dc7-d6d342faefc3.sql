-- Security hardening: Replace overly permissive policies with secure ones

-- 1. Create secure instructor view (no email/phone exposure)
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

-- 2. Secure course visibility policy (replace existing one)
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON public.courses;
CREATE POLICY "Secure course visibility"
ON public.courses
FOR SELECT
USING (
  is_published = true OR 
  instructor_id = auth.uid() OR 
  public.is_admin()
);

-- 3. Secure session progress policy (replace existing one)  
DROP POLICY IF EXISTS "Users can manage own progress" ON public.session_progress;
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