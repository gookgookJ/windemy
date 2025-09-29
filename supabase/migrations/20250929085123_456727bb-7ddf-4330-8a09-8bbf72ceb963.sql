-- Create admin_note_comments table for comment feature
CREATE TABLE public.admin_note_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.admin_notes(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for admin_note_comments
ALTER TABLE public.admin_note_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_note_comments
CREATE POLICY "Admins can manage all note comments" 
ON public.admin_note_comments 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_note_comments_updated_at
BEFORE UPDATE ON public.admin_note_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();