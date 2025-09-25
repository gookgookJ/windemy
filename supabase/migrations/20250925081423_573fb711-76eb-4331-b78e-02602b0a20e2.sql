-- Create table for multiple course materials
CREATE TABLE public.course_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.course_sections(id) ON DELETE CASCADE NULL,
  session_id UUID REFERENCES public.course_sessions(id) ON DELETE CASCADE NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint: material must belong to either a section or session, not both
  CONSTRAINT check_material_belongs_to_one_parent CHECK (
    (section_id IS NOT NULL AND session_id IS NULL) OR 
    (section_id IS NULL AND session_id IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Course materials are viewable by everyone"
ON public.course_materials
FOR SELECT
USING (true);

CREATE POLICY "Instructors can manage own course materials"
ON public.course_materials
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_materials.course_id 
    AND (c.instructor_id = auth.uid() OR is_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = course_materials.course_id 
    AND (c.instructor_id = auth.uid() OR is_admin())
  )
);

-- Create indexes for better performance
CREATE INDEX idx_course_materials_course_id ON public.course_materials(course_id);
CREATE INDEX idx_course_materials_section_id ON public.course_materials(section_id);
CREATE INDEX idx_course_materials_session_id ON public.course_materials(session_id);
CREATE INDEX idx_course_materials_order_index ON public.course_materials(order_index);

-- Create trigger for updated_at
CREATE TRIGGER update_course_materials_updated_at
  BEFORE UPDATE ON public.course_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();