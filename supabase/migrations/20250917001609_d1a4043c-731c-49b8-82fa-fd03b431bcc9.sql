-- 1) Helper: secure admin check that bypasses RLS to avoid recursive policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 2) Replace admin checks across policies with public.is_admin()

-- activity_logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (public.is_admin());

-- announcements
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;
CREATE POLICY "Admins can manage all announcements"
ON public.announcements
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- categories
DROP POLICY IF EXISTS "Only admins can manage categories" ON public.categories;
CREATE POLICY "Only admins can manage categories"
ON public.categories
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- coupons
DROP POLICY IF EXISTS "Admins can manage all coupons" ON public.coupons;
CREATE POLICY "Admins can manage all coupons"
ON public.coupons
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- course_detail_images (instructor OR admin)
DROP POLICY IF EXISTS "Instructors can manage own course detail images" ON public.course_detail_images;
CREATE POLICY "Instructors can manage own course detail images"
ON public.course_detail_images
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_detail_images.course_id
      AND (courses.instructor_id = auth.uid() OR public.is_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_detail_images.course_id
      AND (courses.instructor_id = auth.uid() OR public.is_admin())
  )
);

-- course_options admin policy
DROP POLICY IF EXISTS "Admins can manage all course options" ON public.course_options;
CREATE POLICY "Admins can manage all course options"
ON public.course_options
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- course_sections
DROP POLICY IF EXISTS "Course sections are viewable with course access" ON public.course_sections;
CREATE POLICY "Course sections are viewable with course access"
ON public.course_sections
FOR SELECT
USING (
  (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_sections.course_id
        AND (c.is_published = true OR c.instructor_id = auth.uid())
    )
  ) OR public.is_admin()
);

DROP POLICY IF EXISTS "Instructors can manage own course sections" ON public.course_sections;
CREATE POLICY "Instructors can manage own course sections"
ON public.course_sections
FOR ALL
USING (
  (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_sections.course_id
        AND c.instructor_id = auth.uid()
    )
  ) OR public.is_admin()
)
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_sections.course_id
        AND c.instructor_id = auth.uid()
    )
  ) OR public.is_admin()
);

-- course_sessions
DROP POLICY IF EXISTS "Course sessions are viewable with course access" ON public.course_sessions;
CREATE POLICY "Course sessions are viewable with course access"
ON public.course_sessions
FOR SELECT
USING (
  (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_sessions.course_id
        AND (courses.is_published = true OR courses.instructor_id = auth.uid())
    )
  ) OR public.is_admin()
);

DROP POLICY IF EXISTS "Instructors can manage own course sessions" ON public.course_sessions;
CREATE POLICY "Instructors can manage own course sessions"
ON public.course_sessions
FOR ALL
USING (
  (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_sessions.course_id
        AND courses.instructor_id = auth.uid()
    )
  ) OR public.is_admin()
)
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_sessions.course_id
        AND courses.instructor_id = auth.uid()
    )
  ) OR public.is_admin()
);

-- courses
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
CREATE POLICY "Admins can manage all courses"
ON public.courses
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- enrollments
DROP POLICY IF EXISTS "Admins can manage enrollments (all)" ON public.enrollments;
CREATE POLICY "Admins can manage enrollments (all)"
ON public.enrollments
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- hero_slides
DROP POLICY IF EXISTS "Admins can manage all hero slides" ON public.hero_slides;
CREATE POLICY "Admins can manage all hero slides"
ON public.hero_slides
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- instructors
DROP POLICY IF EXISTS "Admins can manage instructors" ON public.instructors;
CREATE POLICY "Admins can manage instructors"
ON public.instructors
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- order_items
DROP POLICY IF EXISTS "Admins can manage order items (all)" ON public.order_items;
CREATE POLICY "Admins can manage order items (all)"
ON public.order_items
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- orders
DROP POLICY IF EXISTS "Admins can manage orders (all)" ON public.orders;
CREATE POLICY "Admins can manage orders (all)"
ON public.orders
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (public.is_admin());

-- profiles
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

-- Allow public read of instructor-only rows for display needs (name/avatar/bio)
DROP POLICY IF EXISTS "Public can view instructor profiles" ON public.profiles;
CREATE POLICY "Public can view instructor profiles"
ON public.profiles
FOR SELECT
USING (role = 'instructor');

-- session_file_downloads
DROP POLICY IF EXISTS "Admins can view all download logs" ON public.session_file_downloads;
CREATE POLICY "Admins can view all download logs"
ON public.session_file_downloads
FOR SELECT
USING (public.is_admin());

-- support_tickets
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- system_settings
DROP POLICY IF EXISTS "Admins can manage all settings" ON public.system_settings;
CREATE POLICY "Admins can manage all settings"
ON public.system_settings
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());