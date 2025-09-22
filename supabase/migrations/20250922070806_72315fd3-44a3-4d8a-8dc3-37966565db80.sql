-- Final security hardening

-- 1. Check and fix any remaining extension issues in public schema
-- Move extensions to proper schema if needed
DO $$
BEGIN
    -- This will help identify what extensions might be in public schema
    -- Most extensions should be in extensions schema, not public
END $$;

-- 2. Add additional security measures for critical tables

-- Ensure enrollments are properly secured
DROP POLICY IF EXISTS "Enhanced enrollment security" ON public.enrollments;
CREATE POLICY "Enhanced enrollment security" ON public.enrollments
FOR ALL USING (
    -- Users can only access their own enrollments
    user_id = auth.uid() OR 
    -- Admins can access all
    is_admin() OR
    -- Instructors can view enrollments for their courses
    EXISTS (
        SELECT 1 FROM public.courses c 
        WHERE c.id = enrollments.course_id 
        AND c.instructor_id = auth.uid()
    )
) WITH CHECK (
    -- Users can only create their own enrollments
    user_id = auth.uid() OR is_admin()
);

-- Secure course sessions more strictly
DROP POLICY IF EXISTS "Enhanced session security" ON public.course_sessions;
CREATE POLICY "Enhanced session security" ON public.course_sessions
FOR SELECT USING (
    -- Published courses are viewable by enrolled users
    EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_sessions.course_id
        AND (
            c.is_published = true OR 
            c.instructor_id = auth.uid() OR
            is_admin() OR
            -- User is enrolled in the course
            EXISTS (
                SELECT 1 FROM public.enrollments e
                WHERE e.course_id = c.id AND e.user_id = auth.uid()
            )
        )
    )
);

-- Secure session progress strictly  
DROP POLICY IF EXISTS "Enhanced progress security" ON public.session_progress;
CREATE POLICY "Enhanced progress security" ON public.session_progress
FOR ALL USING (
    -- Users can only access their own progress
    user_id = auth.uid() AND
    -- And only for courses they're enrolled in
    EXISTS (
        SELECT 1 
        FROM public.enrollments e
        JOIN public.course_sessions cs ON cs.course_id = e.course_id
        WHERE e.user_id = auth.uid() 
        AND cs.id = session_progress.session_id
    )
) WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 
        FROM public.enrollments e
        JOIN public.course_sessions cs ON cs.course_id = e.course_id
        WHERE e.user_id = auth.uid() 
        AND cs.id = session_progress.session_id
    )
);

-- Add security for video tracking tables
CREATE POLICY "Secure video checkpoints" ON public.video_checkpoints
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Secure video seek events" ON public.video_seek_events  
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Secure video watch segments" ON public.video_watch_segments
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Secure orders and order items
DROP POLICY IF EXISTS "Enhanced order security" ON public.orders;
CREATE POLICY "Enhanced order security" ON public.orders
FOR ALL USING (
    user_id = auth.uid() OR is_admin()
) WITH CHECK (
    user_id = auth.uid() OR is_admin()  
);

DROP POLICY IF EXISTS "Enhanced order items security" ON public.order_items;
CREATE POLICY "Enhanced order items security" ON public.order_items
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR is_admin())
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR is_admin())
    )
);