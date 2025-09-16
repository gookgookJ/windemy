-- Create favorite courses table
CREATE TABLE public.course_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure unique favorite per user per course
  UNIQUE(user_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE public.course_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for course favorites
CREATE POLICY "Users can view their own favorites" 
ON public.course_favorites 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can add their own favorites" 
ON public.course_favorites 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own favorites" 
ON public.course_favorites 
FOR DELETE 
USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX idx_course_favorites_user_id ON public.course_favorites(user_id);
CREATE INDEX idx_course_favorites_course_id ON public.course_favorites(course_id);