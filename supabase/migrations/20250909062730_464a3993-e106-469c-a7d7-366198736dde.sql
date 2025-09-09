-- Create course_sections table to persist curriculum sections
CREATE TABLE IF NOT EXISTS public.course_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;

-- Policies mirroring course_sessions
CREATE POLICY "Course sections are viewable with course access"
  ON public.course_sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_sections.course_id
        AND (
          c.is_published = true
          OR c.instructor_id = auth.uid()
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Instructors can manage own course sections"
  ON public.course_sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_sections.course_id
        AND (c.instructor_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_sections.course_id
        AND (c.instructor_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Add section_id to course_sessions to map sessions to sections
ALTER TABLE public.course_sessions
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.course_sections(id) ON DELETE SET NULL;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_course_sections_course_order ON public.course_sections(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_course_sessions_course_section_order ON public.course_sessions(course_id, section_id, order_index);