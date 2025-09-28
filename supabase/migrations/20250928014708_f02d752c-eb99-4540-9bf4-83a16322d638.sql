-- Create admin notes table for CS history and special notes
CREATE TABLE public.admin_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_notes
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_notes
CREATE POLICY "Admins can manage all admin notes"
ON public.admin_notes
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_notes_updated_at
BEFORE UPDATE ON public.admin_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_admin_notes_user_id ON public.admin_notes(user_id);
CREATE INDEX idx_admin_notes_created_at ON public.admin_notes(created_at DESC);